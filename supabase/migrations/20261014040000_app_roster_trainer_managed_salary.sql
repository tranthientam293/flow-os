-- Trainers manage their own salary; what the owner sets is a reference.
--   * roster_trainer_rates: a trainer's own salary per hour for a session
--     type, set in My settings. It prefills their checkout; the owner's rate
--     (roster_member_session_types.hourly_rate, else the type's default) is
--     shown next to it and used when they haven't set one.
--   * roster_sessions.owner_salary: the owner's figure for a session, shown
--     to the trainer as a reference. roster_sessions.salary is the trainer's
--     figure and the one their income counts.
--   * roster_checkout_session(): the session's own trainer sets salary;
--     anyone else allowed to check it out (the owner) sets owner_salary.
--     Neither overwrites the other's figure.

create table public.roster_trainer_rates (
  center_id       uuid not null,
  member_id       uuid not null,
  session_type_id uuid not null,
  hourly_rate     numeric(14, 2) not null check (hourly_rate >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (member_id, session_type_id),
  foreign key (center_id, member_id) references public.roster_members (center_id, id) on delete cascade,
  foreign key (center_id, session_type_id) references public.roster_session_types (center_id, id) on delete cascade
);

create index roster_trainer_rates_center_member_idx on public.roster_trainer_rates (center_id, member_id);

alter table public.roster_trainer_rates enable row level security;

-- The trainer manages their own rates; the owner can see them.
create policy "roster_trainer_rates: owner or self reads" on public.roster_trainer_rates for select to authenticated
  using (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id));
create policy "roster_trainer_rates: self inserts" on public.roster_trainer_rates for insert to authenticated
  with check (member_id = public.roster_member_id(center_id));
create policy "roster_trainer_rates: self updates" on public.roster_trainer_rates for update to authenticated
  using (member_id = public.roster_member_id(center_id))
  with check (member_id = public.roster_member_id(center_id));
create policy "roster_trainer_rates: self deletes" on public.roster_trainer_rates for delete to authenticated
  using (member_id = public.roster_member_id(center_id));

create trigger roster_trainer_rates_updated_at before update on public.roster_trainer_rates
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.roster_trainer_rates to authenticated;

alter table public.roster_sessions
  add column owner_salary numeric(14, 2) check (owner_salary >= 0);

-- Rate × hours for a session: the trainer's own rate first when p_trainer,
-- then the owner's rate for that trainer, then the type's default.
create or replace function public.roster_rate_salary(p_session public.roster_sessions, p_trainer boolean)
returns numeric
language sql
stable
set search_path = ''
as $$
  select round(
    coalesce(
      case when p_trainer then
        (select tr.hourly_rate from public.roster_trainer_rates tr
         where tr.member_id = p_session.member_id and tr.session_type_id = p_session.session_type_id)
      end,
      (select mst.hourly_rate from public.roster_member_session_types mst
       where mst.member_id = p_session.member_id and mst.session_type_id = p_session.session_type_id),
      (select t.default_hourly_rate from public.roster_session_types t
       where t.id = p_session.session_type_id),
      0
    ) * extract(epoch from (p_session.ends_at - p_session.starts_at)) / 3600,
    2
  );
$$;

revoke execute on function public.roster_rate_salary(public.roster_sessions, boolean) from public, anon, authenticated;

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
  v_owner_salary numeric;
begin
  perform set_config('roster.checkout', 'on', true);

  if v_session.member_id = public.roster_member_id(v_session.center_id) then
    -- The session's trainer: their own figure.
    v_salary := coalesce(p_salary, v_session.salary, public.roster_rate_salary(v_session, true));
    v_owner_salary := v_session.owner_salary;
  else
    -- The owner: their reference figure; the trainer's stays (or starts from
    -- the trainer's rate when the owner completes the session).
    v_owner_salary := coalesce(p_salary, v_session.owner_salary, public.roster_rate_salary(v_session, false));
    v_salary := coalesce(v_session.salary, public.roster_rate_salary(v_session, true));
  end if;
  if v_salary < 0 or v_owner_salary < 0 then
    raise exception 'Salary can''t be negative' using errcode = '23514';
  end if;

  delete from public.roster_session_fees where session_id = v_session.id;
  insert into public.roster_session_fees (center_id, session_id, label, amount)
  select v_session.center_id, v_session.id, btrim(f ->> 'label'), (f ->> 'amount')::numeric
  from jsonb_array_elements(coalesce(p_fees, '[]'::jsonb)) as f;

  update public.roster_sessions
  set status = 'completed',
      salary = v_salary,
      owner_salary = v_owner_salary,
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
  set status = 'scheduled', salary = null, owner_salary = null, completed_at = null
  where id = v_session.id;
  perform set_config('roster.checkout', 'off', true);
end;
$$;

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
    if new.salary is not null or new.owner_salary is not null or new.completed_at is not null then
      raise exception 'Only the owner can set a session''s pay' using errcode = '42501';
    end if;
  elsif new.salary is distinct from old.salary
     or new.owner_salary is distinct from old.owner_salary
     or new.completed_at is distinct from old.completed_at then
    raise exception 'Only the owner can set a session''s pay' using errcode = '42501';
  end if;
  return new;
end;
$$;
