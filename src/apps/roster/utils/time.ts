import { DATE_FORMAT, DAY_FORMAT, MONTH_FORMAT } from "@/constants";
import { dayjs } from "@/libs";
import { MIN_SESSION_MINUTES } from "../constants/options";
import type { Center, SessionType } from "../models/roster";

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

export const formatDate = (date: string) => dayjs(date).format(DATE_FORMAT);

export const formatLongDay = (date: string) => dayjs(date).format(DAY_FORMAT);

export function formatWeekRange(start: string) {
  const a = dayjs(start);
  return `${formatDate(a.format(DATE))} – ${formatDate(a.add(6, "day").format(DATE))}`;
}

export const formatMonth = (date: string) => dayjs(date).format(MONTH_FORMAT);

export function inCurrentMonth(center: Center, startsAt: string) {
  const day = inTz(startsAt, center.timezone).format(DATE);
  const { first, last } = monthBounds(todayIn(center.timezone));
  return day >= first && day <= last;
}

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
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

export function monthBounds(date: string) {
  const d = dayjs(date);
  return {
    first: d.startOf("month").format(DATE),
    last: d.endOf("month").format(DATE),
  };
}

export type Period = "day" | "week";

export const periodRange = (
  anchor: string,
  period: Period,
  weekStart: number,
) =>
  period === "day"
    ? { start: anchor, days: 1 }
    : { start: weekStartOf(anchor, weekStart), days: 7 };

export const stepPeriod = (anchor: string, period: Period, direction: 1 | -1) =>
  addDays(anchor, direction * (period === "week" ? 7 : 1));

export const minSessionMinutes = (
  type?: Pick<SessionType, "min_session_min">,
) =>
  Math.max(type?.min_session_min ?? MIN_SESSION_MINUTES, MIN_SESSION_MINUTES);
