alter table public.roster_centers
  add column opens_at  time not null default '07:00',
  add column closes_at time not null default '22:00',
  add constraint roster_centers_hours_check check (closes_at > opens_at);

create index roster_sessions_series_idx on public.roster_sessions (series_id, starts_at) where series_id is not null;

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

  if tg_op = 'INSERT' or new.session_type_id <> old.session_type_id then
    if exists (select 1 from public.roster_session_types st where st.id = new.session_type_id and st.archived_at is not null) then
      raise exception 'This session type is archived' using errcode = '23514';
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
     and (new.branch_id <> old.branch_id or new.session_type_id <> old.session_type_id)
     and not public.roster_can_book(new.member_id, new.branch_id, new.session_type_id) then
    raise exception 'You aren''t assigned to this branch or session type' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke execute on function public.roster_sessions_guard() from public, anon, authenticated;

create or replace function public.roster_update_series(
  p_session_id uuid,
  p_start time,
  p_end time,
  p_branch_id uuid,
  p_session_type_id uuid,
  p_title text,
  p_note text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.roster_sessions;
  v_tz text;
  v_count integer;
begin
  select * into v_session from public.roster_sessions s where s.id = p_session_id;
  if v_session.id is null or v_session.series_id is null then
    raise exception 'This session doesn''t repeat' using errcode = 'P0002';
  end if;

  select c.timezone into v_tz from public.roster_centers c where c.id = v_session.center_id;

  update public.roster_sessions s
  set starts_at       = ((s.starts_at at time zone v_tz)::date + p_start) at time zone v_tz,
      ends_at         = ((s.starts_at at time zone v_tz)::date + p_end) at time zone v_tz,
      branch_id       = p_branch_id,
      session_type_id = p_session_type_id,
      title           = p_title,
      note            = p_note
  where s.series_id = v_session.series_id
    and s.starts_at >= v_session.starts_at
    and (s.status = 'scheduled' or s.id = v_session.id);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.roster_update_series(uuid, time, time, uuid, uuid, text, text) from public, anon;
grant execute on function public.roster_update_series(uuid, time, time, uuid, uuid, text, text) to authenticated;
