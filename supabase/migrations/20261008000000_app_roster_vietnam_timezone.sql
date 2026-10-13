-- Roster supports Vietnam time only for now. Existing centers move to
-- Asia/Ho_Chi_Minh; Asia/Bangkok and Asia/Saigon are also UTC+7 with no
-- daylight saving, so no session moves. Drop the check to allow more zones.

update public.roster_centers
set timezone = 'Asia/Ho_Chi_Minh'
where timezone <> 'Asia/Ho_Chi_Minh';

alter table public.roster_centers
  alter column timezone set default 'Asia/Ho_Chi_Minh',
  add constraint roster_centers_timezone_supported check (timezone = 'Asia/Ho_Chi_Minh');
