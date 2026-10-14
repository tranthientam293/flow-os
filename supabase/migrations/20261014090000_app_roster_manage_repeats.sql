-- Managing weekly repeats: edit and stop take effect from the moment they're
-- made. Upcoming sessions the repeat booked that nobody has changed since
-- (still scheduled, updated_by null) are removed; editing then books the new
-- rule again up to the horizon. Past sessions, and upcoming ones edited by
-- hand, stay as they are.
--   * roster_repeat_fill(): never books a time that has already passed.
--   * roster_update_repeat(): edits a repeat (not its trainer).
--   * roster_stop_repeat(): stops a repeat.
-- Both are for the owner or the repeat's trainer.

create or replace function public.roster_repeat_fill(
  p_repeat_id uuid,
  p_from date,
  p_to date,
  p_trainer_window boolean
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.roster_repeats;
  c public.roster_centers;
  v_day date;
  v_start timestamptz;
  v_end timestamptz;
  v_count integer := 0;
begin
  select * into r from public.roster_repeats where id = p_repeat_id;
  select * into c from public.roster_centers where id = r.center_id;
  if r.starts_time < c.opens_at or r.ends_time > c.closes_at then
    return 0;
  end if;

  for v_day in
    select d::date from generate_series(greatest(p_from, r.starts_on), p_to, interval '1 day') d
  loop
    continue when not (extract(dow from v_day)::smallint = any (r.weekdays));
    v_start := (v_day + r.starts_time) at time zone c.timezone;
    v_end := (v_day + r.ends_time) at time zone c.timezone;
    continue when v_start <= now();
    continue when p_trainer_window and not public.roster_trainer_can_edit(r.center_id, v_start);
    continue when exists (
      select 1 from public.roster_sessions s
      where s.member_id = r.member_id
        and (s.repeat_id = r.id and (s.starts_at at time zone c.timezone)::date = v_day
             or s.status in ('scheduled', 'completed')
                and s.starts_at < v_end and s.ends_at > v_start)
    );

    insert into public.roster_sessions (
      center_id, member_id, branch_id, session_type_id, starts_at, ends_at,
      title, note, trainee_count, status, repeat_id, created_by)
    values (
      r.center_id, r.member_id, r.branch_id, r.session_type_id, v_start, v_end,
      r.title, r.note, r.trainee_count, 'scheduled', r.id, r.created_by);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke execute on function public.roster_repeat_fill(uuid, date, date, boolean) from public, anon, authenticated;

-- The repeat, locked, if the caller may manage it (the owner or its trainer).
create or replace function public.roster_repeat_target(p_repeat_id uuid)
returns public.roster_repeats
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.roster_repeats;
begin
  select * into r from public.roster_repeats where id = p_repeat_id for update;
  if not found then
    raise exception 'Repeat not found' using errcode = 'P0002';
  end if;
  if not (public.roster_is_owner(r.center_id)
          or r.member_id = public.roster_member_id(r.center_id)) then
    raise exception 'You can''t change this repeat' using errcode = '42501';
  end if;
  if r.stopped_at is not null then
    raise exception 'This repeat is stopped' using errcode = '23514';
  end if;
  return r;
end;
$$;

revoke execute on function public.roster_repeat_target(uuid) from public, anon, authenticated;

-- Removes the repeat's upcoming sessions nobody has changed.
create or replace function public.roster_repeat_clear_upcoming(p_repeat_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  delete from public.roster_sessions
  where repeat_id = p_repeat_id
    and status = 'scheduled'
    and updated_by is null
    and starts_at > now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.roster_repeat_clear_upcoming(uuid) from public, anon, authenticated;

create or replace function public.roster_update_repeat(
  p_repeat_id uuid,
  p_branch_id uuid,
  p_session_type_id uuid,
  p_weekdays smallint[],
  p_starts_time time,
  p_ends_time time,
  p_title text,
  p_note text,
  p_trainee_count smallint
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.roster_repeats := public.roster_repeat_target(p_repeat_id);
  v_tz text;
  v_horizon date := public.roster_repeat_horizon(r.center_id);
begin
  if not public.roster_is_owner(r.center_id)
     and not public.roster_can_book(r.member_id, p_branch_id) then
    raise exception 'You aren''t assigned to this branch' using errcode = '42501';
  end if;
  if not exists (select 1 from public.roster_branches b
                 where b.id = p_branch_id and b.center_id = r.center_id and b.archived_at is null)
     or (p_session_type_id is not null and not exists (
           select 1 from public.roster_session_types t
           where t.id = p_session_type_id and t.center_id = r.center_id)) then
    raise exception 'Branch or session type not found' using errcode = '23514';
  end if;

  perform public.roster_repeat_clear_upcoming(r.id);

  select c.timezone into v_tz from public.roster_centers c where c.id = r.center_id;
  update public.roster_repeats
  set branch_id = p_branch_id,
      session_type_id = p_session_type_id,
      weekdays = p_weekdays,
      starts_time = p_starts_time,
      ends_time = p_ends_time,
      title = nullif(trim(p_title), ''),
      note = nullif(trim(p_note), ''),
      trainee_count = coalesce(p_trainee_count, 1),
      generated_through = greatest(v_horizon, starts_on - 1)
  where id = r.id;

  -- Book the new rule from today (times already passed are skipped).
  return public.roster_repeat_fill(r.id, (now() at time zone v_tz)::date, v_horizon, false);
end;
$$;

revoke execute on function public.roster_update_repeat(uuid, uuid, uuid, smallint[], time, time, text, text, smallint) from public, anon;
grant execute on function public.roster_update_repeat(uuid, uuid, uuid, smallint[], time, time, text, text, smallint) to authenticated;

-- Stops a repeat; returns how many upcoming sessions were removed.
create or replace function public.roster_stop_repeat(p_repeat_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.roster_repeats := public.roster_repeat_target(p_repeat_id);
begin
  update public.roster_repeats set stopped_at = now() where id = r.id;
  return public.roster_repeat_clear_upcoming(r.id);
end;
$$;

revoke execute on function public.roster_stop_repeat(uuid) from public, anon;
grant execute on function public.roster_stop_repeat(uuid) to authenticated;

-- Stopping goes through roster_stop_repeat now.
revoke update (stopped_at) on public.roster_repeats from authenticated;
drop policy if exists "roster_repeats: owner or its trainer stops" on public.roster_repeats;
