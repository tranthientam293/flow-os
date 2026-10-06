import { dayjs } from "@/libs";
import type { Center } from "../models/roster";

export const DATE = "YYYY-MM-DD";

export const inTz = (iso: string, tz: string) => dayjs(iso).tz(tz);

export const todayIn = (tz: string) => dayjs().tz(tz).format(DATE);

export const addDays = (date: string, days: number) =>
  dayjs(date).add(days, "day").format(DATE);

export const monthOf = (date: string) =>
  dayjs(date).startOf("month").format(DATE);

export function weekStartOf(date: string, weekStart: number) {
  const d = dayjs(date);
  const offset = (d.day() - weekStart + 7) % 7;
  return d.subtract(offset, "day").format(DATE);
}

export const daysFrom = (start: string, count: number) =>
  Array.from({ length: count }, (_, i) => addDays(start, i));

export const zonedIso = (date: string, time: string, tz: string) =>
  dayjs.tz(`${date} ${time}`, tz).toISOString();

export const dayStartIso = (date: string, tz: string) =>
  zonedIso(date, "00:00", tz);

export function minutesOfDay(iso: string, tz: string) {
  const d = inTz(iso, tz);
  return d.hour() * 60 + d.minute();
}

export const formatTime = (iso: string, tz: string) =>
  inTz(iso, tz).format("HH:mm");

export const formatRange = (startsAt: string, endsAt: string, tz: string) =>
  `${formatTime(startsAt, tz)}–${formatTime(endsAt, tz)}`;

export const durationHours = (startsAt: string, endsAt: string) =>
  dayjs(endsAt).diff(dayjs(startsAt), "minute") / 60;

export const formatDay = (date: string) => dayjs(date).format("ddd D");

export const formatLongDay = (date: string) => dayjs(date).format("ddd, MMM D");

export const formatMonth = (month: string) => dayjs(month).format("MMMM YYYY");

export function formatWeekRange(start: string) {
  const a = dayjs(start);
  const b = a.add(6, "day");
  if (a.month() === b.month())
    return `${a.format("MMM D")} – ${b.format("D, YYYY")}`;
  if (a.year() === b.year())
    return `${a.format("MMM D")} – ${b.format("MMM D, YYYY")}`;
  return `${a.format("MMM D, YYYY")} – ${b.format("MMM D, YYYY")}`;
}

export function trainerWindow(center: Center) {
  const today = todayIn(center.timezone);
  const earliestDate =
    center.past_edit_days === 0
      ? today
      : addDays(today, -center.past_edit_days);
  const latestDate = monthBounds(today).last;
  const earliest =
    center.past_edit_days === 0
      ? dayjs()
      : dayjs.tz(earliestDate, center.timezone);
  return { earliestDate, latestDate, earliest };
}

export function trainerCanEdit(center: Center, startsAt: string) {
  const { earliest, latestDate } = trainerWindow(center);
  const start = dayjs(startsAt);
  const end = dayjs.tz(addDays(latestDate, 1), center.timezone);
  return !start.isBefore(earliest) && start.isBefore(end);
}

export function editableUntil(center: Center, startsAt: string) {
  const date = inTz(startsAt, center.timezone).format(DATE);
  return dayjs(addDays(date, center.past_edit_days)).format("MMM D");
}

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export function allTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
}

export const hhmm = (time: string) => time.slice(0, 5);

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function openingHours(center: Center) {
  return {
    open: hhmm(center.opens_at),
    close: hhmm(center.closes_at),
    openMinutes: timeToMinutes(center.opens_at),
    closeMinutes: timeToMinutes(center.closes_at),
  };
}

export const minutesToTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// First and last day of the month that contains `date`. Sessions can only be
// booked within the current month.
export function monthBounds(date: string) {
  const d = dayjs(date);
  return {
    first: d.startOf("month").format(DATE),
    last: d.endOf("month").format(DATE),
  };
}
