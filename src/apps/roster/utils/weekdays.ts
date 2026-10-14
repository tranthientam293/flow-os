// 0 = Sunday … 6 = Saturday, as in the database.
export const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "Mon, Wed, Fri" in week order, starting on `weekStart` (0 = Sunday).
export const formatWeekdays = (days: number[], weekStart: number) =>
  [...days]
    .sort((a, b) => ((a - weekStart + 7) % 7) - ((b - weekStart + 7) % 7))
    .map((d) => WEEKDAY_NAMES[d])
    .join(", ");
