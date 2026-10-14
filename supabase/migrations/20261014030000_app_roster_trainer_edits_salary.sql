-- Checkout: a trainer can now set the salary for their own session too, not
-- just the fees. Owner and trainer alike: the salary sent wins; without one,
-- a salary already saved stays; otherwise it comes from the trainer's rate
-- for the session type (or the type's default) × hours. Who may check out a
-- session is unchanged (roster_checkout_target).

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

  v_salary := coalesce(
    p_salary,
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
