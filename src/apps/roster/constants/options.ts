// Only Vietnam time is supported for now (enforced by a check on
// roster_centers.timezone). Add zones here and drop that check to allow more.
export const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

export const TIMEZONES = [
  { value: DEFAULT_TIMEZONE, label: "Vietnam (GMT+7)" },
];

export const timezoneLabel = (timezone: string) =>
  TIMEZONES.find((tz) => tz.value === timezone)?.label ?? timezone;

export const HOUR_HEIGHT_PX = 48;

export const MIN_SESSION_MINUTES = 60;
export const MAX_SESSION_HOURS = 12;

export const OVERLAP_CONSTRAINT = "roster_sessions_no_overlap";
