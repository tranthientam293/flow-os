-- Salary per hour or per trainee, chosen per session type.
--   * roster_session_types.pay_basis: 'hour' (rate × hours, as before) or
--     'trainee' (rate × the session's number of trainees). The rate columns
--     keep their names (default_hourly_rate, hourly_rate) but now hold the
--     rate per unit of the type's basis.
--   * roster_sessions.trainee_count: how many trainees the session has, set
--     when it's booked or edited.
--   * roster_rate_salary(): rate × hours or rate × trainees by the session
--     type's basis (no type = per hour).

alter table public.roster_session_types
  add column pay_basis text not null default 'hour' check (pay_basis in ('hour', 'trainee'));

alter table public.roster_sessions
  add column trainee_count smallint check (trainee_count between 0 and 999);

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
    ) * case
      when (select t.pay_basis from public.roster_session_types t where t.id = p_session.session_type_id) = 'trainee'
        then coalesce(p_session.trainee_count, 0)
      else extract(epoch from (p_session.ends_at - p_session.starts_at)) / 3600
    end,
    2
  );
$$;

revoke execute on function public.roster_rate_salary(public.roster_sessions, boolean) from public, anon, authenticated;
