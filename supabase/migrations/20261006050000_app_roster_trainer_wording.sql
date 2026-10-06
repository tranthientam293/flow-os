-- Roster UI says "trainer"; use the same word in user-facing errors.

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
      raise exception 'This trainer is inactive' using errcode = '23514';
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
    raise exception 'Only trainers can leave a center' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.roster_sessions_guard() from public, anon, authenticated;
