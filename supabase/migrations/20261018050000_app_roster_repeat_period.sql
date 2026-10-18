-- Repeats book a week or a month at a time (`period`). A weekly repeat books
-- through the end of the week and adds the next week on the week's last day;
-- a monthly one books through the end of the month and adds the next month on
-- the month's last day. `roster_apply_repeat` books the next period right away.

alter table public.roster_repeats
  add column period text not null default 'week' check (period in ('week', 'month'));

-- The last date a repeat of this period is booked through, for a center,
-- today. With p_ahead, through the end of the next period.
create or replace function public.roster_repeat_horizon(
  p_center_id uuid,
  p_period text,
  p_ahead boolean default false
)
returns date
language sql
stable
set search_path = ''
as $$
  select case p_period
    when 'month' then
      case when p_ahead or d.today = d.month_end
        then (date_trunc('month', d.today) + interval '2 month' - interval '1 day')::date
        else d.month_end
      end
    else
      case when p_ahead or d.today = d.week_end then d.week_end + 7 else d.week_end end
  end
  from public.roster_centers c
  cross join lateral (select (now() at time zone c.timezone)::date as today) t
  cross join lateral (
    select t.today,
           t.today + ((c.week_start + 6 - extract(dow from t.today)::int + 7) % 7) as week_end,
           (date_trunc('month', t.today) + interval '1 month' - interval '1 day')::date as month_end
  ) d
  where c.id = p_center_id;
$$;

revoke execute on function public.roster_repeat_horizon(uuid, text, boolean) from public, anon, authenticated;

drop function public.roster_start_repeat(uuid, uuid, uuid, uuid, smallint[], time, time, text, text, date, smallint);

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
  p_trainee_count smallint default 1,
  p_period text default 'week'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_horizon date := public.roster_repeat_horizon(p_center_id, p_period);
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
    starts_time, ends_time, title, note, starts_on, trainee_count, period, generated_through)
  values (
    p_center_id, p_member_id, p_branch_id, p_session_type_id, p_weekdays,
    p_starts_time, p_ends_time, nullif(trim(p_title), ''), nullif(trim(p_note), ''),
    p_starts_on, coalesce(p_trainee_count, 1), coalesce(p_period, 'week'),
    greatest(v_horizon, p_starts_on - 1))
  returning id into v_id;

  return public.roster_repeat_fill(v_id, p_starts_on, v_horizon, false);
end;
$$;

revoke execute on function public.roster_start_repeat(uuid, uuid, uuid, uuid, smallint[], time, time, text, text, date, smallint, text) from public, anon;
grant execute on function public.roster_start_repeat(uuid, uuid, uuid, uuid, smallint[], time, time, text, text, date, smallint, text) to authenticated;

drop function public.roster_update_repeat(uuid, uuid, uuid, smallint[], time, time, text, text, smallint);

-- Rebooks through whichever is later, the new period's horizon or what the
-- repeat had already booked, so switching to a shorter period (or editing
-- after Apply now) doesn't drop booked dates.
create or replace function public.roster_update_repeat(
  p_repeat_id uuid,
  p_branch_id uuid,
  p_session_type_id uuid,
  p_weekdays smallint[],
  p_starts_time time,
  p_ends_time time,
  p_title text,
  p_note text,
  p_trainee_count smallint,
  p_period text default 'week'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.roster_repeats := public.roster_repeat_target(p_repeat_id);
  v_tz text;
  v_through date := greatest(
    public.roster_repeat_horizon(r.center_id, coalesce(p_period, 'week')),
    r.generated_through);
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
      period = coalesce(p_period, 'week'),
      generated_through = greatest(v_through, starts_on - 1)
  where id = r.id;

  return public.roster_repeat_fill(r.id, (now() at time zone v_tz)::date, v_through, false);
end;
$$;

revoke execute on function public.roster_update_repeat(uuid, uuid, uuid, smallint[], time, time, text, text, smallint, text) from public, anon;
grant execute on function public.roster_update_repeat(uuid, uuid, uuid, smallint[], time, time, text, text, smallint, text) to authenticated;

-- Books the repeat's next period now (through the end of next week or next
-- month) instead of waiting for the job. Returns how many sessions were booked.
create or replace function public.roster_apply_repeat(p_repeat_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.roster_repeats := public.roster_repeat_target(p_repeat_id);
  v_through date := public.roster_repeat_horizon(r.center_id, r.period, true);
  v_count integer := 0;
begin
  if not exists (select 1 from public.roster_members m
                 where m.id = r.member_id and m.status = 'active')
     or not exists (select 1 from public.roster_branches b
                    where b.id = r.branch_id and b.archived_at is null) then
    raise exception 'The trainer or branch is no longer active' using errcode = '23514';
  end if;

  if r.generated_through < v_through then
    v_count := public.roster_repeat_fill(r.id, r.generated_through + 1, v_through, false);
    update public.roster_repeats set generated_through = v_through where id = r.id;
  end if;
  return v_count;
end;
$$;

revoke execute on function public.roster_apply_repeat(uuid) from public, anon;
grant execute on function public.roster_apply_repeat(uuid) to authenticated;

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
           public.roster_repeat_horizon(rp.center_id, rp.period) as horizon,
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

drop function public.roster_repeat_horizon(uuid);
