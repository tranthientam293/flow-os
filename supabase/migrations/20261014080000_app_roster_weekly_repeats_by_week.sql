-- Weekly repeats, booked a week at a time. A repeat is a rule (trainer,
-- branch, type, weekdays, times, trainees) with no end date; its sessions are
-- ordinary sessions, edited on their own (`repeat_id` records where they came
-- from). Sessions are booked up to a horizon in the center's timezone: the
-- end of the current week, or, on the last day of the week (Sunday when weeks
-- start on Monday), the end of next week. Starting a repeat books up to the
-- horizon right away; an hourly job keeps every active repeat booked up to
-- it, so each Sunday the next week's sessions are added. Stopping a repeat
-- keeps the sessions already booked.
--
-- Replaces the month-at-a-time version (20261012000000), whose job was
-- unscheduled; repeats left from it are stopped so they don't come back.

update public.roster_repeats set stopped_at = now() where stopped_at is null;

alter table public.roster_repeats
  add column trainee_count smallint not null default 1 check (trainee_count between 1 and 999);

comment on column public.roster_repeats.generated_through is 'Last date this repeat has booked sessions through.';

-- The last date repeats are booked through, for a center, today.
create or replace function public.roster_repeat_horizon(p_center_id uuid)
returns date
language sql
stable
set search_path = ''
as $$
  select case
    -- Today is the last day of the week: through the end of next week.
    when extract(dow from d.today)::int = (c.week_start + 6) % 7 then d.today + 7
    -- Otherwise through the end of this week.
    else d.today + ((c.week_start + 6 - extract(dow from d.today)::int + 7) % 7)
  end
  from public.roster_centers c
  cross join lateral (select (now() at time zone c.timezone)::date as today) d
  where c.id = p_center_id;
$$;

revoke execute on function public.roster_repeat_horizon(uuid) from public, anon, authenticated;

-- Books a repeat's sessions from p_from to p_to (inclusive). Skips dates
-- before the repeat starts, outside opening hours, dates where the trainer
-- already has a scheduled or completed session at that time, and dates this
-- repeat already booked. With p_trainer_window, also skips dates the trainer
-- may not book themselves.
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

drop function public.roster_start_repeat(uuid, uuid, uuid, uuid, smallint[], time, time, text, text, date);

-- Sets up a weekly repeat and books it up to the horizon. Returns how many
-- sessions were booked now. The owner can set one up for any trainer; a
-- trainer for themselves at a branch they may book.
create or replace function public.roster_start_repeat(
  p_center_id uuid,
  p_member_id uuid,
  p_branch_id uuid,
  p_session_type_id uuid,
  p_weekdays smallint[],
  p_starts_time time,
  p_ends_time time,
  p_title text,
  p_note text,
  p_starts_on date,
  p_trainee_count smallint default 1
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_horizon date := public.roster_repeat_horizon(p_center_id);
  v_id uuid;
begin
  if not public.roster_is_owner(p_center_id) and (
       p_member_id is distinct from public.roster_member_id(p_center_id)
       or not public.roster_can_book(p_member_id, p_branch_id)) then
    raise exception 'You can''t book this session' using errcode = '42501';
  end if;

  if not exists (select 1 from public.roster_members m
                 where m.id = p_member_id and m.center_id = p_center_id and m.status = 'active')
     or not exists (select 1 from public.roster_branches b
                    where b.id = p_branch_id and b.center_id = p_center_id and b.archived_at is null)
     or (p_session_type_id is not null and not exists (
           select 1 from public.roster_session_types t
           where t.id = p_session_type_id and t.center_id = p_center_id)) then
    raise exception 'Trainer, branch or session type not found' using errcode = '23514';
  end if;

  select c.timezone into v_tz from public.roster_centers c where c.id = p_center_id;
  if p_starts_on < (now() at time zone v_tz)::date then
    raise exception 'A repeat can''t start in the past' using errcode = '23514';
  end if;

  insert into public.roster_repeats (
    center_id, member_id, branch_id, session_type_id, weekdays,
    starts_time, ends_time, title, note, starts_on, trainee_count, generated_through)
  values (
    p_center_id, p_member_id, p_branch_id, p_session_type_id, p_weekdays,
    p_starts_time, p_ends_time, nullif(trim(p_title), ''), nullif(trim(p_note), ''),
    p_starts_on, coalesce(p_trainee_count, 1), greatest(v_horizon, p_starts_on - 1))
  returning id into v_id;

  -- Repeats are booked ahead by design, so the trainer's edit window doesn't
  -- apply (the weekly job doesn't apply it either).
  return public.roster_repeat_fill(v_id, p_starts_on, v_horizon, false);
end;
$$;

revoke execute on function public.roster_start_repeat(uuid, uuid, uuid, uuid, smallint[], time, time, text, text, date, smallint) from public, anon;
grant execute on function public.roster_start_repeat(uuid, uuid, uuid, uuid, smallint[], time, time, text, text, date, smallint) to authenticated;

-- Keeps every active repeat booked up to its center's horizon (run hourly;
-- does nothing until the horizon moves on, i.e. on the last day of a week).
create or replace function public.roster_generate_repeats()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  for r in
    select rp.id,
           rp.generated_through,
           public.roster_repeat_horizon(rp.center_id) as horizon,
           m.status = 'active' and b.archived_at is null as bookable
    from public.roster_repeats rp
    join public.roster_members m on m.id = rp.member_id
    join public.roster_branches b on b.id = rp.branch_id
    where rp.stopped_at is null
  loop
    continue when r.generated_through >= r.horizon;
    if r.bookable then
      perform public.roster_repeat_fill(r.id, r.generated_through + 1, r.horizon, false);
    end if;
    update public.roster_repeats set generated_through = r.horizon where id = r.id;
  end loop;
end;
$$;

revoke execute on function public.roster_generate_repeats() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('roster-generate-repeats', '5 * * * *', 'select public.roster_generate_repeats()');
