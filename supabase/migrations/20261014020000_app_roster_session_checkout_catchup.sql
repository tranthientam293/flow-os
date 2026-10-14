-- Catch-up for 20261008010000_app_roster_session_checkout, which never ran on
-- flow-os-prod (its history was later marked applied without it). Adds what
-- that migration created and no later migration redefines: the pay columns,
-- roster_session_fees, the pay guard and roster_reopen_session, plus the
-- grants. roster_checkout_target and roster_checkout_session are left alone:
-- their newer versions (edit_current_month, trainer_checkout_fees) are
-- already in place. Idempotent, so it's a no-op where the original ran
-- (flow-os-app, fresh databases).

alter table public.roster_sessions
  add column if not exists salary numeric(14, 2) check (salary >= 0),
  add column if not exists completed_at timestamptz;

create table if not exists public.roster_session_fees (
  id         uuid primary key default gen_random_uuid(),
  center_id  uuid not null references public.roster_centers (id) on delete cascade,
  session_id uuid not null references public.roster_sessions (id) on delete cascade,
  label      text not null check (char_length(btrim(label)) between 1 and 80),
  amount     numeric(14, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists roster_session_fees_session_idx on public.roster_session_fees (session_id);
create index if not exists roster_session_fees_center_idx on public.roster_session_fees (center_id);

alter table public.roster_session_fees enable row level security;

-- Readable by the owner and the session's trainer; written only by the RPCs.
drop policy if exists "roster_session_fees: owner or session trainer reads" on public.roster_session_fees;
create policy "roster_session_fees: owner or session trainer reads" on public.roster_session_fees for select to authenticated
  using (
    public.roster_is_owner(center_id)
    or exists (
      select 1 from public.roster_sessions s
      where s.id = session_id and s.member_id = public.roster_member_id(s.center_id)
    )
  );

revoke all on table public.roster_session_fees from anon, authenticated;
grant select on public.roster_session_fees to authenticated;

-- Only the owner (or the checkout RPCs) may change pay columns directly.
create or replace function public.roster_sessions_pay_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('roster.checkout', true), '') = 'on'
     or auth.uid() is null
     or public.roster_is_owner(new.center_id) then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.salary is not null or new.completed_at is not null then
      raise exception 'Only the owner can set a session''s pay' using errcode = '42501';
    end if;
  elsif new.salary is distinct from old.salary
     or new.completed_at is distinct from old.completed_at then
    raise exception 'Only the owner can set a session''s pay' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function public.roster_sessions_pay_guard() from public, anon, authenticated;

drop trigger if exists roster_sessions_pay_guard on public.roster_sessions;
create trigger roster_sessions_pay_guard before insert or update on public.roster_sessions
  for each row execute function public.roster_sessions_pay_guard();

create or replace function public.roster_reopen_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.roster_sessions := public.roster_checkout_target(p_session_id);
begin
  perform set_config('roster.checkout', 'on', true);
  delete from public.roster_session_fees where session_id = v_session.id;
  update public.roster_sessions
  set status = 'scheduled', salary = null, completed_at = null
  where id = v_session.id;
  perform set_config('roster.checkout', 'off', true);
end;
$$;

revoke execute on function public.roster_checkout_session(uuid, numeric, jsonb) from public, anon;
revoke execute on function public.roster_reopen_session(uuid) from public, anon;
grant execute on function public.roster_checkout_session(uuid, numeric, jsonb) to authenticated;
grant execute on function public.roster_reopen_session(uuid) to authenticated;
