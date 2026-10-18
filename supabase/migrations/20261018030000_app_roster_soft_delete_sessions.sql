-- Deleting a session is a soft delete: it gets deleted_at / deleted_by and
-- leaves the schedule, income and overlap checks, and its trainer can restore
-- it from the Deleted tab while it's still in the current month.
--   * roster_delete_session(): marks the session deleted (owner any session,
--     a trainer their own, current month only).
--   * roster_restore_session(): brings it back (same rule; fails if its time
--     now overlaps another session).
--   * A deleted session of a weekly repeat keeps its day taken, so the repeat
--     doesn't book that day again. That replaces roster_repeat_skips.
--   * Deleted sessions can't be edited, completed or reopened, and nothing is
--     deleted for good from the app anymore (no delete policy).
--   * History logs "deleted" and "undeleted".

alter table public.roster_sessions
  add column deleted_at timestamptz,
  add column deleted_by uuid;

create index roster_sessions_deleted_idx on public.roster_sessions (center_id, member_id, deleted_at)
  where deleted_at is not null;

-- Deleted sessions don't block the time.
alter table public.roster_sessions drop constraint roster_sessions_no_overlap;
alter table public.roster_sessions add constraint roster_sessions_no_overlap
  exclude using gist (member_id with =, tstzrange(starts_at, ends_at) with &&)
  where (status in ('scheduled', 'completed') and deleted_at is null);

drop policy "roster_sessions: owner or trainer deletes this month" on public.roster_sessions;

drop policy "roster_sessions: owner or trainer edits this month" on public.roster_sessions;
create policy "roster_sessions: owner or trainer edits this month" on public.roster_sessions for update to authenticated
  using (
    deleted_at is null
    and public.roster_in_current_month(center_id, starts_at)
    and (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id))
  )
  with check (
    deleted_at is null
    and public.roster_in_current_month(center_id, starts_at)
    and (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id))
  );

alter table public.roster_session_events drop constraint roster_session_events_action_check;
alter table public.roster_session_events add constraint roster_session_events_action_check
  check (action in ('booked', 'edited', 'completed', 'checkout_updated', 'reopened',
                    'cancelled', 'missed', 'restored', 'deleted', 'undeleted'));

create or replace function public.roster_sessions_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := 'booked';
  elsif new.deleted_at is distinct from old.deleted_at then
    v_action := case when new.deleted_at is null then 'undeleted' else 'deleted' end;
  elsif new.status is distinct from old.status then
    v_action := case
      when new.status = 'completed' then 'completed'
      when new.status = 'cancelled' then 'cancelled'
      when new.status = 'missed' then 'missed'
      when old.status = 'completed' then 'reopened'
      else 'restored'
    end;
  elsif new.status = 'completed'
        and coalesce(current_setting('roster.checkout', true), '') = 'on' then
    v_action := 'checkout_updated';
  elsif (new.member_id, new.branch_id, new.session_type_id, new.starts_at, new.ends_at, new.title, new.note)
        is distinct from
        (old.member_id, old.branch_id, old.session_type_id, old.starts_at, old.ends_at, old.title, old.note) then
    v_action := 'edited';
  else
    return null;
  end if;

  insert into public.roster_session_events (center_id, session_id, actor_id, action)
  values (new.center_id, new.id, auth.uid(), v_action);
  return null;
end;
$$;

-- The session, locked, if the caller may delete or restore it.
create or replace function public.roster_delete_target(p_session_id uuid)
returns public.roster_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.roster_sessions;
begin
  select * into v_session from public.roster_sessions where id = p_session_id for update;
  if not found then
    raise exception 'Session not found' using errcode = 'P0002';
  end if;
  if not public.roster_in_current_month(v_session.center_id, v_session.starts_at) then
    raise exception 'Only sessions in the current month can be changed' using errcode = '42501';
  end if;
  if not (
    public.roster_is_owner(v_session.center_id)
    or v_session.member_id = public.roster_member_id(v_session.center_id)
  ) then
    raise exception 'You can''t change this session' using errcode = '42501';
  end if;
  return v_session;
end;
$$;
revoke execute on function public.roster_delete_target(uuid) from public, anon, authenticated;

create or replace function public.roster_delete_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.roster_sessions := public.roster_delete_target(p_session_id);
begin
  if v_session.deleted_at is not null then
    return;
  end if;
  update public.roster_sessions
  set deleted_at = now(), deleted_by = auth.uid()
  where id = v_session.id;
end;
$$;

create or replace function public.roster_restore_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.roster_sessions := public.roster_delete_target(p_session_id);
begin
  if v_session.deleted_at is null then
    return;
  end if;
  update public.roster_sessions
  set deleted_at = null, deleted_by = null
  where id = v_session.id;
end;
$$;

revoke execute on function public.roster_restore_session(uuid) from public, anon;
grant execute on function public.roster_restore_session(uuid) to authenticated;

-- Completing and undoing completion skip deleted sessions.
create or replace function public.roster_checkout_target(p_session_id uuid)
returns public.roster_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.roster_sessions;
begin
  select * into v_session from public.roster_sessions where id = p_session_id for update;
  if not found or v_session.deleted_at is not null then
    raise exception 'Session not found' using errcode = 'P0002';
  end if;
  if not (
    public.roster_is_owner(v_session.center_id)
    or v_session.member_id = public.roster_member_id(v_session.center_id)
  ) then
    raise exception 'You can''t complete this session' using errcode = '42501';
  end if;
  if not public.roster_in_current_month(v_session.center_id, v_session.starts_at) then
    raise exception 'Only sessions in the current month can be changed' using errcode = '42501';
  end if;
  if v_session.status not in ('scheduled', 'completed') then
    raise exception 'Restore this session before completing it' using errcode = '23514';
  end if;
  if v_session.starts_at > now() then
    raise exception 'A session can be completed once it has started' using errcode = '23514';
  end if;
  return v_session;
end;
$$;
revoke execute on function public.roster_checkout_target(uuid) from public, anon, authenticated;

-- Stopping or editing a repeat leaves deleted sessions alone.
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
    and deleted_at is null
    and starts_at > now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke execute on function public.roster_repeat_clear_upcoming(uuid) from public, anon, authenticated;

-- As in 20261014090000_app_roster_manage_repeats.sql: a day the repeat
-- already has a session for (deleted or not) is left alone; deleted sessions
-- don't count as overlaps.
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

revoke execute on function public.roster_repeat_fill(uuid, date, date, boolean) from public, anon, authenticated;

drop table public.roster_repeat_skips;
