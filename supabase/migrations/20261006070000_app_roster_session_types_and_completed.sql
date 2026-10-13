-- Booking drawer v2:
--   * session types (owner-managed names) that give a session its default title
--   * a 'completed' status for sessions marked as done
--   * new sessions can only be booked within the current month (center time)

-- Session types ----------------------------------------------------------------

create table public.roster_session_types (
  id         uuid primary key default gen_random_uuid(),
  center_id  uuid not null references public.roster_centers (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (center_id, id),
  unique (center_id, name)
);

alter table public.roster_session_types enable row level security;

create policy "roster_session_types: members read" on public.roster_session_types for select to authenticated
  using (public.roster_member_id(center_id) is not null);
create policy "roster_session_types: owner inserts" on public.roster_session_types for insert to authenticated
  with check (public.roster_is_owner(center_id));
create policy "roster_session_types: owner updates" on public.roster_session_types for update to authenticated
  using (public.roster_is_owner(center_id)) with check (public.roster_is_owner(center_id));
create policy "roster_session_types: owner deletes" on public.roster_session_types for delete to authenticated
  using (public.roster_is_owner(center_id));

revoke all on table public.roster_session_types from anon, authenticated;
grant select, insert, update, delete on public.roster_session_types to authenticated;

alter table public.roster_sessions
  add column session_type_id uuid,
  add constraint roster_sessions_center_id_session_type_id_fkey
    foreign key (center_id, session_type_id)
    references public.roster_session_types (center_id, id)
    on delete set null (session_type_id);

create index roster_sessions_center_type_idx on public.roster_sessions (center_id, session_type_id);

-- Completed status ---------------------------------------------------------------

alter table public.roster_sessions drop constraint roster_sessions_status_check;
alter table public.roster_sessions add constraint roster_sessions_status_check
  check (status in ('scheduled', 'completed', 'missed', 'cancelled'));

-- A completed session still occupies its trainer's time.
alter table public.roster_sessions drop constraint roster_sessions_no_overlap;
alter table public.roster_sessions add constraint roster_sessions_no_overlap
  exclude using gist (member_id with =, tstzrange(starts_at, ends_at) with &&)
  where (status in ('scheduled', 'completed'));

-- Current month only --------------------------------------------------------------

create or replace function public.roster_in_current_month(p_center_id uuid, p_ts timestamptz)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roster_centers c
    where c.id = p_center_id
      and date_trunc('month', p_ts at time zone c.timezone) = date_trunc('month', now() at time zone c.timezone)
  );
$$;

revoke execute on function public.roster_in_current_month(uuid, timestamptz) from public, anon;
grant execute on function public.roster_in_current_month(uuid, timestamptz) to authenticated;

-- Trainers' window now ends with the current month as well.
create or replace function public.roster_trainer_can_edit(p_center_id uuid, p_starts_at timestamptz)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roster_centers c
    cross join lateral (select (now() at time zone c.timezone)::date as today) t
    where c.id = p_center_id
      and p_starts_at >= case
        when c.past_edit_days = 0 then now()
        else (t.today - c.past_edit_days)::timestamp at time zone c.timezone
      end
      and p_starts_at < ((date_trunc('month', t.today) + interval '1 month')::timestamp at time zone c.timezone)
  );
$$;

drop policy "roster_sessions: owner or teacher books" on public.roster_sessions;
create policy "roster_sessions: owner or trainer books" on public.roster_sessions for insert to authenticated
  with check (
    public.roster_in_current_month(center_id, starts_at)
    and (
      public.roster_is_owner(center_id)
      or (
        member_id = public.roster_member_id(center_id)
        and public.roster_can_book(member_id, branch_id)
        and public.roster_trainer_can_edit(center_id, starts_at)
      )
    )
  );
