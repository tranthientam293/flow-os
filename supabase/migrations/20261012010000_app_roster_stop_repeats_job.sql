-- The weekly repeat feature is removed from the app. Stop booking new months;
-- roster_repeats, roster_sessions.repeat_id and the repeat functions stay in
-- place (unused), and sessions already booked stay as ordinary sessions.

select cron.unschedule('roster-generate-repeats');
