import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import dayjs, { type Dayjs } from "dayjs";

const PARAM = "month";
const FORMAT = "YYYY-MM";

// The month shown by the dashboard and the expense list, kept in the URL
// (?month=YYYY-MM) so both pages share it and it survives a reload. Missing,
// invalid or future months mean the current month, which drops the param.
export function useMonthParam(): [Dayjs, (month: Dayjs) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(PARAM);

  const month = useMemo(() => {
    const thisMonth = dayjs().startOf("month");
    const parsed = raw ? dayjs(`${raw}-01`) : null;
    return parsed?.isValid() && !parsed.isAfter(thisMonth) ? parsed : thisMonth;
  }, [raw]);

  const setMonth = useCallback(
    (next: Dayjs) =>
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (next.isSame(dayjs(), "month")) updated.delete(PARAM);
          else updated.set(PARAM, next.format(FORMAT));
          return updated;
        },
        { replace: true },
      ),
    [setParams],
  );

  return [month, setMonth];
}
