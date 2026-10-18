-- A trainer can delete any of their own sessions in the current month, also
-- ones that have already started (was upcoming only). The owner still deletes
-- any session in the current month.

drop policy "roster_sessions: owner or trainer deletes this month" on public.roster_sessions;
create policy "roster_sessions: owner or trainer deletes this month" on public.roster_sessions for delete to authenticated
  using (
    public.roster_in_current_month(center_id, starts_at)
    and (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id))
  );

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
    or v_session.member_id = public.roster_member_id(v_session.center_id)
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
