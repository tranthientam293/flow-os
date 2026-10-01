import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

type DateInput = string | number | Date;

export const fromNow = (date: DateInput) => dayjs(date).fromNow();

export const formatDate = (date: DateInput) => dayjs(date).format("ll");

export { dayjs };
