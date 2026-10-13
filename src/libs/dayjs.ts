import dayjs from "dayjs";
import { DATE_FORMAT } from "@/constants";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

type DateInput = string | number | Date;

export const fromNow = (date: DateInput) => dayjs(date).fromNow();

export const formatDate = (date: DateInput) => dayjs(date).format(DATE_FORMAT);

export { dayjs };
export type { Dayjs } from "dayjs";
