-- Session history: who did what to a session, and when. Written by a trigger,
-- so every path (booking form, popover actions, checkout, API) is recorded.
-- Actions: booked, edited, completed, checkout_updated, reopened, cancelled,
-- missed, restored.

create table public.roster_session_events (
  id         uuid primary key default gen_random_uuid(),
  center_id  uuid not null references public.roster_centers (id) on delete cascade,
  session_id uuid not null references public.roster_sessions (id) on delete cascade,
  actor_id   uuid references auth.users (id) on delete set null,
  action     text not null check (action in (
               'booked', 'edited', 'completed', 'checkout_updated',
               'reopened', 'cancelled', 'missed', 'restored')),
  created_at timestamptz not null default now()
);

create index roster_session_events_session_idx on public.roster_session_events (session_id, created_at desc);
create index roster_session_events_center_idx on public.roster_session_events (center_id);

alter table public.roster_session_events enable row level security;

-- Same readers as the session itself: the owner, or the session's trainer.
create policy "roster_session_events: owner or session trainer reads" on public.roster_session_events for select to authenticated
  using (
    public.roster_is_owner(center_id)
    or exists (
      select 1 from public.roster_sessions s
      where s.id = session_id and s.member_id = public.roster_member_id(s.center_id)
    )
  );

revoke all on table public.roster_session_events from anon, authenticated;
grant select on public.roster_session_events to authenticated;

create or replace function public.roster_sessions_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := 'booked';
  elsif new.status is distinct from old.status then
    v_action := case
      when new.status = 'completed' then 'completed'
      when new.status = 'cancelled' then 'cancelled'
      when new.status = 'missed' then 'missed'
      when old.status = 'completed' then 'reopened'
      else 'restored'
    end;
  elsif new.status = 'completed'
        and coalesce(current_setting('roster.checkout', true), '') = 'on' then
    -- Saving the checkout again (salary or fees).
    v_action := 'checkout_updated';
  elsif (new.member_id, new.branch_id, new.session_type_id, new.starts_at, new.ends_at, new.title, new.note)
        is distinct from
        (old.member_id, old.branch_id, old.session_type_id, old.starts_at, old.ends_at, old.title, old.note) then
    v_action := 'edited';
  else
    return null;
  end if;

  insert into public.roster_session_events (center_id, session_id, actor_id, action)
  values (new.center_id, new.id, auth.uid(), v_action);
  return null;
end;
$$;

revoke execute on function public.roster_sessions_log() from public, anon, authenticated;

create trigger roster_sessions_log after insert or update on public.roster_sessions
  for each row execute function public.roster_sessions_log();

-- Backfill: what's known for existing sessions.
insert into public.roster_session_events (center_id, session_id, actor_id, action, created_at)
select center_id, id, created_by, 'booked', created_at
from public.roster_sessions;

insert into public.roster_session_events (center_id, session_id, actor_id, action, created_at)
select center_id, id, updated_by,
       case status
         when 'completed' then 'completed'
         when 'cancelled' then 'cancelled'
         when 'missed' then 'missed'
         else 'edited'
       end,
       updated_at
from public.roster_sessions
where updated_by is not null;
