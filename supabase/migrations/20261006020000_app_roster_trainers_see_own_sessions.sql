drop policy "roster_sessions: members read" on public.roster_sessions;

create policy "roster_sessions: owner or self reads" on public.roster_sessions for select to authenticated
  using (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id));
