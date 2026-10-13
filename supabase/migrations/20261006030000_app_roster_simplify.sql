-- Roster 2.0: owners set up a center (branches, teachers), teachers join by
-- invite and book their own sessions. Removes session types, fees, income,
-- month closing, repeating shifts, business presets and custom labels.

-- Session policies reference functions dropped below.
drop policy "roster_sessions: owner or trainer books" on public.roster_sessions;
drop policy "roster_sessions: owner or trainer edits" on public.roster_sessions;
drop policy "roster_sessions: owner or trainer deletes" on public.roster_sessions;

drop function public.roster_update_series(uuid, time, time, uuid, uuid, text, text);
drop function public.roster_reopen_month(uuid, date);
drop function public.roster_close_month(uuid, date);
drop function public.roster_income(uuid, date, uuid);
drop function public.roster_compute_income(uuid, date, uuid);
drop function public.roster_my_rates(uuid);
drop function public.roster_session_type_directory(uuid);
drop function public.roster_month_open(uuid, timestamptz);
drop function public.roster_create_center(text, text, text, text, jsonb, text, text, jsonb);

drop table public.roster_income_lines;
drop table public.roster_month_closes;
drop table public.roster_fee_members;
drop table public.roster_fees;
drop table public.roster_member_session_types;

drop index public.roster_sessions_series_idx;
drop index public.roster_sessions_center_type_idx;
alter table public.roster_sessions
  drop column session_type_id,
  drop column series_id;

drop table public.roster_session_types;

alter table public.roster_centers
  drop column currency,
  drop column business_type,
  drop column labels;

drop function public.roster_currency_digits(text);
drop function public.roster_valid_labels(jsonb);

drop function public.roster_can_book(uuid, uuid, uuid);

create or replace function public.roster_can_book(p_member_id uuid, p_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roster_members m
    where m.id = p_member_id
      and (
        m.role = 'owner'
        or m.any_branch
        or exists (
          select 1 from public.roster_member_branches mb
          where mb.member_id = m.id and mb.branch_id = p_branch_id
        )
      )
  );
$$;

create or replace function public.roster_sessions_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tz text;
  v_open time;
  v_close time;
  v_day date;
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(v_uid, new.created_by);
    new.updated_by := null;
  else
    if new.center_id <> old.center_id then
      raise exception 'A session can''t move to another center' using errcode = '42501';
    end if;
    new.created_by := old.created_by;
    new.updated_by := coalesce(v_uid, new.updated_by);
  end if;

  if tg_op = 'INSERT' or new.starts_at <> old.starts_at or new.ends_at <> old.ends_at then
    select c.timezone, c.opens_at, c.closes_at
    into v_tz, v_open, v_close
    from public.roster_centers c
    where c.id = new.center_id;

    v_day := (new.starts_at at time zone v_tz)::date;
    if new.starts_at < ((v_day + v_open) at time zone v_tz)
       or new.ends_at > ((v_day + v_close) at time zone v_tz) then
      raise exception 'Sessions must be within opening hours (% – %)',
        to_char(v_open, 'HH24:MI'), to_char(v_close, 'HH24:MI')
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'INSERT' or new.branch_id <> old.branch_id then
    if exists (select 1 from public.roster_branches b where b.id = new.branch_id and b.archived_at is not null) then
      raise exception 'This branch is archived' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'INSERT' or new.member_id <> old.member_id then
    if exists (select 1 from public.roster_members m where m.id = new.member_id and m.status = 'inactive') then
      raise exception 'This teacher is inactive' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'UPDATE'
     and v_uid is not null
     and not public.roster_is_owner(new.center_id)
     and new.branch_id <> old.branch_id
     and not public.roster_can_book(new.member_id, new.branch_id) then
    raise exception 'You aren''t assigned to this branch' using errcode = '42501';
  end if;

  return new;
end;
$$;

create policy "roster_sessions: owner or teacher books" on public.roster_sessions for insert to authenticated
  with check (
    public.roster_is_owner(center_id)
    or (
      member_id = public.roster_member_id(center_id)
      and public.roster_can_book(member_id, branch_id)
      and public.roster_trainer_can_edit(center_id, starts_at)
    )
  );
create policy "roster_sessions: owner or teacher edits" on public.roster_sessions for update to authenticated
  using (
    public.roster_is_owner(center_id)
    or (member_id = public.roster_member_id(center_id) and public.roster_trainer_can_edit(center_id, starts_at))
  )
  with check (
    public.roster_is_owner(center_id)
    or (member_id = public.roster_member_id(center_id) and public.roster_trainer_can_edit(center_id, starts_at))
  );
create policy "roster_sessions: owner or teacher deletes" on public.roster_sessions for delete to authenticated
  using (
    public.roster_is_owner(center_id)
    or (member_id = public.roster_member_id(center_id) and starts_at > now())
  );

create or replace function public.roster_create_center(
  p_name text,
  p_timezone text,
  p_display_name text,
  p_color text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_center uuid;
begin
  if v_uid is null or v_email is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  insert into public.roster_centers (name, timezone, created_by)
  values (btrim(p_name), p_timezone, v_uid)
  returning id into v_center;

  insert into public.roster_members (center_id, user_id, role, status, display_name, email, color)
  values (v_center, v_uid, 'owner', 'active', btrim(p_display_name), v_email, p_color);

  return v_center;
end;
$$;

create or replace function public.roster_leave_center(p_center_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.roster_members m
  set status = 'inactive', user_id = null
  where m.center_id = p_center_id
    and m.user_id = auth.uid()
    and m.role = 'trainer'
    and m.status = 'active';

  if not found then
    raise exception 'Only teachers can leave a center' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function
  public.roster_can_book(uuid, uuid),
  public.roster_create_center(text, text, text, text)
from public, anon;

grant execute on function
  public.roster_can_book(uuid, uuid),
  public.roster_create_center(text, text, text, text)
to authenticated;

revoke execute on function public.roster_sessions_guard() from public, anon, authenticated;
