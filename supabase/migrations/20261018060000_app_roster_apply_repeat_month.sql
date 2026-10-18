-- Apply now books the repeat for the whole current month, days already past
-- included, and removes its untouched sessions in later months.

drop function public.roster_repeat_fill(uuid, date, date, boolean);

-- Books a repeat's sessions from p_from to p_to (inclusive). Skips dates
-- outside opening hours, dates where the trainer already has a scheduled or
-- completed session at that time, and dates this repeat already booked
-- (deleted ones included). Unless p_include_past, also skips dates before the
-- repeat starts and times already passed. With p_trainer_window, skips dates
-- the trainer may not book themselves.
create or replace function public.roster_repeat_fill(
  p_repeat_id uuid,
  p_from date,
  p_to date,
  p_trainer_window boolean,
  p_include_past boolean default false
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
    select d::date from generate_series(
      case when p_include_past then p_from else greatest(p_from, r.starts_on) end,
      p_to, interval '1 day') d
  loop
    continue when not (extract(dow from v_day)::smallint = any (r.weekdays));
    v_start := (v_day + r.starts_time) at time zone c.timezone;
    v_end := (v_day + r.ends_time) at time zone c.timezone;
    continue when not p_include_past and v_start <= now();
    continue when p_trainer_window and not public.roster_trainer_can_edit(r.center_id, v_start);
    continue when exists (
      select 1 from public.roster_sessions s
      where s.member_id = r.member_id
        and (s.repeat_id = r.id and (s.starts_at at time zone c.timezone)::date = v_day
             or s.status in ('scheduled', 'completed') and s.deleted_at is null
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

revoke execute on function public.roster_repeat_fill(uuid, date, date, boolean, boolean) from public, anon, authenticated;

-- Books the repeat for the whole current month now, days already past
-- included, and removes its untouched upcoming sessions after this month.
-- Returns how many sessions were booked.
create or replace function public.roster_apply_repeat(p_repeat_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.roster_repeats := public.roster_repeat_target(p_repeat_id);
  v_tz text;
  v_month_start date;
  v_month_end date;
  v_count integer;
begin
  if not exists (select 1 from public.roster_members m
                 where m.id = r.member_id and m.status = 'active')
     or not exists (select 1 from public.roster_branches b
                    where b.id = r.branch_id and b.archived_at is null) then
    raise exception 'The trainer or branch is no longer active' using errcode = '23514';
  end if;

  select c.timezone into v_tz from public.roster_centers c where c.id = r.center_id;
  v_month_start := date_trunc('month', now() at time zone v_tz)::date;
  v_month_end := (v_month_start + interval '1 month' - interval '1 day')::date;

  delete from public.roster_sessions
  where repeat_id = r.id
    and status = 'scheduled'
    and updated_by is null
    and deleted_at is null
    and starts_at >= (v_month_end + 1)::timestamp at time zone v_tz;

  v_count := public.roster_repeat_fill(r.id, v_month_start, v_month_end, false, true);
  update public.roster_repeats set generated_through = v_month_end where id = r.id;
  return v_count;
end;
$$;

revoke execute on function public.roster_apply_repeat(uuid) from public, anon;
grant execute on function public.roster_apply_repeat(uuid) to authenticated;
