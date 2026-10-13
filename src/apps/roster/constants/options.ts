import type { SessionStatus } from "../models/roster";

// Only Vietnam time is supported for now (enforced by a check on
// roster_centers.timezone). Add zones here and drop that check to allow more.
export const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

export const TIMEZONES = [
  { value: DEFAULT_TIMEZONE, label: "Vietnam (GMT+7)" },
];

export const timezoneLabel = (timezone: string) =>
  TIMEZONES.find((tz) => tz.value === timezone)?.label ?? timezone;

export const HOUR_HEIGHT_PX = 48;

// Schedule items are colored by status (border and tint).
export const SESSION_STATUS_OPTIONS: { value: SessionStatus; label: string }[] =
  [
    { value: "scheduled", label: "Scheduled" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "missed", label: "Missed" },
  ];

// Every status: the status filter's default.
export const ALL_STATUSES = SESSION_STATUS_OPTIONS.map((o) => o.value);

// No status picked counts as every status.
export const statusesOrAll = (statuses: SessionStatus[]) =>
  statuses.length ? statuses : ALL_STATUSES;

export const matchesStatuses = (statuses: SessionStatus[], status: string) =>
  statusesOrAll(statuses).includes(status as SessionStatus);

export const SESSION_STATUS_COLOR: Record<string, string> = {
  scheduled: "#3b82f6",
  completed: "var(--brand)",
  cancelled: "var(--destructive)",
  missed: "var(--warning)",
};

export const statusColor = (status: string) =>
  SESSION_STATUS_COLOR[status] ?? SESSION_STATUS_COLOR.scheduled;

export const MIN_SESSION_MINUTES = 60;
export const MAX_SESSION_HOURS = 12;

export const OVERLAP_CONSTRAINT = "roster_sessions_no_overlap";
