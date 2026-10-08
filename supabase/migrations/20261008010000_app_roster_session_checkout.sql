-- Session checkout: completing a session records the trainer's pay for it.
--   * roster_sessions.salary: the salary for this session (null = not checked out yet)
--   * roster_session_fees: extra pay on top of the salary (travel, materials, …)
--   * roster_checkout_session(): the only way to complete a session with pay.
--     The owner sets the salary and fees; a trainer can complete their own
--     session, and gets the salary from their rate (they can't set their pay).
--   * roster_reopen_session(): undo a checkout.

alter table public.roster_sessions
  add column salary numeric(14, 2) check (salary >= 0),
  add column completed_at timestamptz;

create table public.roster_session_fees (
  id         uuid primary key default gen_random_uuid(),
  center_id  uuid not null references public.roster_centers (id) on delete cascade,
  session_id uuid not null references public.roster_sessions (id) on delete cascade,
  label      text not null check (char_length(btrim(label)) between 1 and 80),
  amount     numeric(14, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create index roster_session_fees_session_idx on public.roster_session_fees (session_id);
create index roster_session_fees_center_idx on public.roster_session_fees (center_id);

alter table public.roster_session_fees enable row level security;

-- Readable by the owner and the session's trainer; written only by the RPCs.
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

create trigger roster_sessions_pay_guard before insert or update on public.roster_sessions
  for each row execute function public.roster_sessions_pay_guard();

-- Who may check out or reopen a session: the owner, or its trainer within
-- their edit window. It must have started and not be cancelled or missed.
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
    or (
      v_session.member_id = public.roster_member_id(v_session.center_id)
      and public.roster_trainer_can_edit(v_session.center_id, v_session.starts_at)
    )
  ) then
    raise exception 'You can''t complete this session' using errcode = '42501';
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

create or replace function public.roster_checkout_session(
  p_session_id uuid,
  p_salary numeric default null,
  p_fees jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.roster_sessions := public.roster_checkout_target(p_session_id);
  v_salary numeric;
begin
  perform set_config('roster.checkout', 'on', true);

  if public.roster_is_owner(v_session.center_id) then
    v_salary := coalesce(p_salary, 0);
    if v_salary < 0 then
      raise exception 'Salary can''t be negative' using errcode = '23514';
    end if;

    delete from public.roster_session_fees where session_id = v_session.id;
    insert into public.roster_session_fees (center_id, session_id, label, amount)
    select v_session.center_id, v_session.id, btrim(f ->> 'label'), (f ->> 'amount')::numeric
    from jsonb_array_elements(coalesce(p_fees, '[]'::jsonb)) as f;
  else
    -- A trainer keeps a salary the owner already set; otherwise it comes from
    -- their rate for the session type (or the type's default) × hours.
    v_salary := coalesce(
      v_session.salary,
      round(
        coalesce(
          (select mst.hourly_rate from public.roster_member_session_types mst
           where mst.member_id = v_session.member_id and mst.session_type_id = v_session.session_type_id),
          (select t.default_hourly_rate from public.roster_session_types t
           where t.id = v_session.session_type_id),
          0
        ) * extract(epoch from (v_session.ends_at - v_session.starts_at)) / 3600,
        2
      )
    );
  end if;

  update public.roster_sessions
  set status = 'completed',
      salary = v_salary,
      completed_at = coalesce(completed_at, now())
  where id = v_session.id;

  perform set_config('roster.checkout', 'off', true);
end;
$$;

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
