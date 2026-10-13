-- Trainers: the session types they teach (none = all) and their hourly salary.
-- The rate is on roster_members, so only the owner and the trainer can read it
-- (the member directory RPC doesn't return it).

alter table public.roster_members
  add column hourly_rate numeric(14, 2) check (hourly_rate >= 0);

create table public.roster_member_session_types (
  center_id       uuid not null,
  member_id       uuid not null,
  session_type_id uuid not null,
  created_at      timestamptz not null default now(),
  primary key (member_id, session_type_id),
  foreign key (center_id, member_id) references public.roster_members (center_id, id) on delete cascade,
  foreign key (center_id, session_type_id) references public.roster_session_types (center_id, id) on delete cascade
);

create index roster_member_session_types_center_member_idx on public.roster_member_session_types (center_id, member_id);
create index roster_member_session_types_center_type_idx on public.roster_member_session_types (center_id, session_type_id);

alter table public.roster_member_session_types enable row level security;

create policy "roster_member_session_types: members read" on public.roster_member_session_types for select to authenticated
  using (public.roster_member_id(center_id) is not null);
create policy "roster_member_session_types: owner inserts" on public.roster_member_session_types for insert to authenticated
  with check (public.roster_is_owner(center_id));
create policy "roster_member_session_types: owner deletes" on public.roster_member_session_types for delete to authenticated
  using (public.roster_is_owner(center_id));

revoke all on table public.roster_member_session_types from anon, authenticated;
grant select, insert, delete on public.roster_member_session_types to authenticated;
