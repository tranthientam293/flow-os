-- No owner's reference salary per session: roster_sessions.owner_salary is
-- dropped. The session's trainer sets the salary at checkout; the owner can
-- still complete a session and edit its fees, and the salary then starts
-- from the trainer's rate (their own, else the owner's, else the type's
-- default) × hours or × trainees.

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

  if v_session.member_id = public.roster_member_id(v_session.center_id) then
    -- The session's trainer: their own figure.
    v_salary := coalesce(p_salary, v_session.salary, public.roster_rate_salary(v_session, true));
  else
    -- The owner: the trainer's salary stays, or starts from their rate.
    v_salary := coalesce(v_session.salary, public.roster_rate_salary(v_session, true));
  end if;
  if v_salary < 0 then
    raise exception 'Salary can''t be negative' using errcode = '23514';
  end if;

  delete from public.roster_session_fees where session_id = v_session.id;
  insert into public.roster_session_fees (center_id, session_id, label, amount)
  select v_session.center_id, v_session.id, btrim(f ->> 'label'), (f ->> 'amount')::numeric
  from jsonb_array_elements(coalesce(p_fees, '[]'::jsonb)) as f;

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

alter table public.roster_sessions drop column owner_salary;
