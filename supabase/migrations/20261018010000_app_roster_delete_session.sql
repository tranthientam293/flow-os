-- Deleting a session. Only sessions in the center's current month, by the
-- owner, or by the session's own trainer for an upcoming one (as the delete
-- policy already allows).
--   * roster_delete_session(): deletes one session. For a session a weekly
--     repeat booked, it also remembers that day as skipped, so the repeat
--     keeps running but never books that day again (stopping or editing a
--     repeat still removes its untouched upcoming sessions, without skips).
--   * roster_repeat_skips: the skipped days per repeat.
--   * roster_repeat_fill(): leaves skipped days out.

create table public.roster_repeat_skips (
  repeat_id  uuid not null references public.roster_repeats (id) on delete cascade,
  day        date not null,
  created_at timestamptz not null default now(),
  primary key (repeat_id, day)
);

-- Only the security definer functions below touch it.
alter table public.roster_repeat_skips enable row level security;
revoke all on table public.roster_repeat_skips from anon, authenticated;

create or replace function public.roster_delete_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.roster_sessions;
  v_tz text;
begin
  select * into v_session from public.roster_sessions where id = p_session_id for update;
  if not found then
    raise exception 'Session not found' using errcode = 'P0002';
  end if;
  if not public.roster_in_current_month(v_session.center_id, v_session.starts_at) then
    raise exception 'Only sessions in the current month can be deleted' using errcode = '42501';
  end if;
  if not (
    public.roster_is_owner(v_session.center_id)
    or (v_session.member_id = public.roster_member_id(v_session.center_id)
        and v_session.starts_at > now())
  ) then
    raise exception 'You can''t delete this session' using errcode = '42501';
  end if;

  if v_session.repeat_id is not null then
    select timezone into v_tz from public.roster_centers where id = v_session.center_id;
    insert into public.roster_repeat_skips (repeat_id, day)
    values (v_session.repeat_id, (v_session.starts_at at time zone v_tz)::date)
    on conflict do nothing;
  end if;

  delete from public.roster_sessions where id = p_session_id;
end;
$$;

revoke execute on function public.roster_delete_session(uuid) from public, anon;
grant execute on function public.roster_delete_session(uuid) to authenticated;

-- As in 20261014090000_app_roster_manage_repeats.sql, plus skipped days.
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
    continue when exists (
      select 1 from public.roster_repeat_skips k
      where k.repeat_id = r.id and k.day = v_day
    );
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
