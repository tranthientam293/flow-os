-- Completing a session records how many trainees actually came:
-- roster_checkout_session takes p_trainee_count (null keeps the booked
-- count). It's saved before the salary is worked out, so a salary taken
-- from the rate uses the actual count.

drop function if exists public.roster_checkout_session(uuid, numeric, jsonb);

create or replace function public.roster_checkout_session(
  p_session_id uuid,
  p_salary numeric default null,
  p_fees jsonb default '[]'::jsonb,
  p_trainee_count integer default null
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

  if p_trainee_count is not null then
    if p_trainee_count not between 1 and 999 then
      raise exception 'Trainees must be between 1 and 999' using errcode = '23514';
    end if;
    v_session.trainee_count := p_trainee_count;
  end if;

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
      trainee_count = v_session.trainee_count,
      completed_at = coalesce(completed_at, now())
  where id = v_session.id;

  perform set_config('roster.checkout', 'off', true);
end;
$$;

revoke execute on function public.roster_checkout_session(uuid, numeric, jsonb, integer) from public, anon;
grant execute on function public.roster_checkout_session(uuid, numeric, jsonb, integer) to authenticated;
