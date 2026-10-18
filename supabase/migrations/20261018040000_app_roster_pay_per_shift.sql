-- Session types can pay per shift: the rate once per session, whatever its
-- length or number of trainees. New types default to per shift; existing
-- types keep their basis.

alter table public.roster_session_types
  drop constraint roster_session_types_pay_basis_check,
  add constraint roster_session_types_pay_basis_check
    check (pay_basis in ('shift', 'hour', 'trainee')),
  alter column pay_basis set default 'shift';

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
    ) * case (select t.pay_basis from public.roster_session_types t where t.id = p_session.session_type_id)
      when 'shift' then 1
      when 'trainee' then coalesce(p_session.trainee_count, 0)
      else extract(epoch from (p_session.ends_at - p_session.starts_at)) / 3600
    end,
    2
  );
$$;

revoke execute on function public.roster_rate_salary(public.roster_sessions, boolean) from public, anon, authenticated;
