-- Weekly repeats with no end date. A repeat is a rule (trainer, branch, type,
-- weekdays, times); its sessions are created one month at a time: the rest of
-- the current month when it is set up, then each new month when it begins in
-- the center's timezone (hourly pg_cron job). Created sessions are ordinary
-- sessions, edited on their own; `repeat_id` only records where they came
-- from. Stopping a repeat keeps the sessions already created.

create table public.roster_repeats (
  id                uuid primary key default gen_random_uuid(),
  center_id         uuid not null references public.roster_centers (id) on delete cascade,
  member_id         uuid not null references public.roster_members (id) on delete cascade,
  branch_id         uuid not null references public.roster_branches (id) on delete cascade,
  session_type_id   uuid references public.roster_session_types (id) on delete set null,
  -- 0 = Sunday … 6 = Saturday.
  weekdays          smallint[] not null
                    check (cardinality(weekdays) > 0 and weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  starts_time       time not null,
  ends_time         time not null check (ends_time > starts_time),
  title             text check (char_length(title) <= 200),
  note              text check (char_length(note) <= 1000),
  starts_on         date not null,
  -- First day of the last month whose sessions were created.
  generated_through date not null,
  stopped_at        timestamptz,
  created_by        uuid default auth.uid() references auth.users (id) on delete set null,
  created_at        timestamptz not null default now()
);

create index roster_repeats_center_idx on public.roster_repeats (center_id);
create index roster_repeats_member_idx on public.roster_repeats (member_id);
create index roster_repeats_active_idx on public.roster_repeats (generated_through) where stopped_at is null;

alter table public.roster_sessions
  add column repeat_id uuid references public.roster_repeats (id) on delete set null;
create index roster_sessions_repeat_idx on public.roster_sessions (repeat_id) where repeat_id is not null;

alter table public.roster_repeats enable row level security;

create policy "roster_repeats: owner or its trainer reads" on public.roster_repeats for select to authenticated
  using (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id));

-- Only stopping goes through the API; setting up uses roster_start_repeat.
create policy "roster_repeats: owner or its trainer stops" on public.roster_repeats for update to authenticated
  using (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id))
  with check (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id));

revoke all on table public.roster_repeats from anon, authenticated;
grant select on public.roster_repeats to authenticated;
grant update (stopped_at) on public.roster_repeats to authenticated;

-- Books a repeat's sessions from p_from to p_to (inclusive). Skips dates
-- outside opening hours, dates where the trainer already has a scheduled or
-- completed session at that time, and dates this repeat already booked. With
-- p_trainer_window, also skips dates the trainer may not book themselves.
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
      title, note, status, repeat_id, created_by)
    values (
      r.center_id, r.member_id, r.branch_id, r.session_type_id, v_start, v_end,
      r.title, r.note, 'scheduled', r.id, r.created_by);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke execute on function public.roster_repeat_fill(uuid, date, date, boolean) from public, anon, authenticated;

-- Sets up a repeat and books its sessions for the rest of the current month.
-- Same permissions as booking: the owner for anyone, a trainer for themselves
-- at a branch they're assigned to. Returns how many sessions were booked.
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
  p_starts_on date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner boolean := public.roster_is_owner(p_center_id);
  v_tz text;
  v_month date;
  v_id uuid;
begin
  if not v_owner and (
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
  v_month := date_trunc('month', now() at time zone v_tz)::date;
  if date_trunc('month', p_starts_on)::date <> v_month then
    raise exception 'A repeat starts in the current month' using errcode = '23514';
  end if;

  insert into public.roster_repeats (
    center_id, member_id, branch_id, session_type_id, weekdays,
    starts_time, ends_time, title, note, starts_on, generated_through)
  values (
    p_center_id, p_member_id, p_branch_id, p_session_type_id, p_weekdays,
    p_starts_time, p_ends_time, nullif(trim(p_title), ''), nullif(trim(p_note), ''),
    p_starts_on, v_month)
  returning id into v_id;

  return public.roster_repeat_fill(
    v_id, p_starts_on, (v_month + interval '1 month' - interval '1 day')::date, not v_owner);
end;
$$;

revoke execute on function public.roster_start_repeat(uuid, uuid, uuid, uuid, smallint[], time, time, text, text, date) from public, anon;
grant execute on function public.roster_start_repeat(uuid, uuid, uuid, uuid, smallint[], time, time, text, text, date) to authenticated;

-- Books the new month for every running repeat whose center has entered a
-- month it hasn't booked yet. Repeats of an inactive trainer or an archived
-- branch skip that month.
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
           date_trunc('month', now() at time zone c.timezone)::date as month,
           m.status = 'active' and b.archived_at is null as bookable
    from public.roster_repeats rp
    join public.roster_centers c on c.id = rp.center_id
    join public.roster_members m on m.id = rp.member_id
    join public.roster_branches b on b.id = rp.branch_id
    where rp.stopped_at is null
      and rp.generated_through < date_trunc('month', now() at time zone c.timezone)::date
  loop
    if r.bookable then
      perform public.roster_repeat_fill(
        r.id, r.month, (r.month + interval '1 month' - interval '1 day')::date, false);
    end if;
    update public.roster_repeats set generated_through = r.month where id = r.id;
  end loop;
end;
$$;

revoke execute on function public.roster_generate_repeats() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('roster-generate-repeats', '5 * * * *', 'select public.roster_generate_repeats()');
