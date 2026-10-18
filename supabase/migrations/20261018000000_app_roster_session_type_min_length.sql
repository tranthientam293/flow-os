-- The center default session length can be as short as 1 minute (was 15).
-- Each session type has its own minimum session length in minutes. New types
-- start at the center's default session length (set in the app); existing
-- types take it now. Booking a session of a type needs at least this long.

alter table public.roster_session_types
  add column min_session_min smallint not null default 60;

update public.roster_session_types st
   set min_session_min = c.default_session_min
  from public.roster_centers c
 where c.id = st.center_id;

alter table public.roster_session_types
  add constraint roster_session_types_min_session_min_check
  check (min_session_min between 1 and 720);

alter table public.roster_centers
  drop constraint if exists roster_centers_default_session_min_check,
  add constraint roster_centers_default_session_min_check
  check (default_session_min between 1 and 480);
