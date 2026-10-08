-- Checkout: a trainer can now enter the additional fees for their own session.
-- The salary stays owner-only (a trainer's comes from their rate).

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
