-- Sessions can be changed only while they are in the center's current month
-- (1st to last day), by the owner or the session's own trainer. Earlier and
-- later months are locked for everyone: edit, cancel, restore, complete, undo
-- completion and delete. Booking was already limited to the current month.
-- The trainer "past edit days" window is gone; roster_centers.past_edit_days
-- stays (unused).

-- Trainers' window is the whole current month, like everyone's.
create or replace function public.roster_trainer_can_edit(p_center_id uuid, p_starts_at timestamptz)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.roster_in_current_month(p_center_id, p_starts_at);
$$;

drop policy "roster_sessions: owner or teacher edits" on public.roster_sessions;
create policy "roster_sessions: owner or trainer edits this month" on public.roster_sessions for update to authenticated
  using (
    public.roster_in_current_month(center_id, starts_at)
    and (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id))
  )
  with check (
    public.roster_in_current_month(center_id, starts_at)
    and (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id))
  );

drop policy "roster_sessions: owner or teacher deletes" on public.roster_sessions;
create policy "roster_sessions: owner or trainer deletes this month" on public.roster_sessions for delete to authenticated
  using (
    public.roster_in_current_month(center_id, starts_at)
    and (
      public.roster_is_owner(center_id)
      or (member_id = public.roster_member_id(center_id) and starts_at > now())
    )
  );

-- Completing and undoing completion follow the same month rule.
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
  if not found then
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
