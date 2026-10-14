-- Every session has at least one trainee: trainee_count defaults to 1 and is
-- never empty (existing sessions without one get 1, and sessions made by
-- weekly repeats start at 1). Salary stays base salary × trainees for
-- per-trainee types and base salary × hours for per-hour types.

update public.roster_sessions set trainee_count = 1 where trainee_count is null;

alter table public.roster_sessions
  alter column trainee_count set default 1,
  alter column trainee_count set not null,
  drop constraint if exists roster_sessions_trainee_count_check,
  add constraint roster_sessions_trainee_count_check check (trainee_count between 1 and 999);
