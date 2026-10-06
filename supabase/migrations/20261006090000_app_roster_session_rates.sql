-- Salary per hour moves from the trainer to each session type they teach:
--   * session types get a default salary per hour
--   * each trainer/session type row can override it (null = use the default)
-- Rates are only readable by the owner and the trainer they belong to.

alter table public.roster_session_types
  add column default_hourly_rate numeric(14, 2) check (default_hourly_rate >= 0);

alter table public.roster_member_session_types
  add column hourly_rate numeric(14, 2) check (hourly_rate >= 0);

-- Keep any rate already set on a trainer for the types they teach.
update public.roster_member_session_types mst
set hourly_rate = m.hourly_rate
from public.roster_members m
where m.id = mst.member_id and m.hourly_rate is not null;

alter table public.roster_members drop column hourly_rate;

drop policy "roster_member_session_types: members read" on public.roster_member_session_types;
create policy "roster_member_session_types: owner or self reads" on public.roster_member_session_types for select to authenticated
  using (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id));
create policy "roster_member_session_types: owner updates" on public.roster_member_session_types for update to authenticated
  using (public.roster_is_owner(center_id)) with check (public.roster_is_owner(center_id));

grant update on public.roster_member_session_types to authenticated;
