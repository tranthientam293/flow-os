import dayjs, { type Dayjs } from "dayjs";
import { ArrowDown, ArrowUp } from "lucide-react";
import { MONTH_FORMAT } from "@/constants";
import { cn } from "@/utils";
import { formatAmount } from "../../utils/money";
import { LimitProgress } from "../molecules";

// The month's total as the dashboard's headline, compared with last month,
// the monthly limit, the daily average and how many expenses there were.
export function SpendingSummary({
  month,
  total,
  count,
  previousTotal,
  limit,
}: {
  month: Dayjs;
  total: number;
  count: number;
  // Last month's total over the same span (see DashboardPage).
  previousTotal: number;
  // From Settings; null when none is set.
  limit: number | null;
}) {
  const current = month.isSame(dayjs(), "month");
  // Days so far this month, or every day of a past month.
  const days = current ? dayjs().date() : month.daysInMonth();
  const comparedWith = current
    ? "the same days last month"
    : month.subtract(1, "month").format(MONTH_FORMAT);
  const change = previousTotal ? (total - previousTotal) / previousTotal : null;
  const up = change !== null && change > 0;

  return (
    <section className='rounded-lg border bg-card p-4 sm:p-5'>
      <p className='text-sm text-muted-foreground'>
        Spent in {month.format(MONTH_FORMAT)}
      </p>
      <p className='mt-1 text-4xl font-semibold text-foreground sm:text-5xl'>
        {formatAmount(total)}
      </p>
      <p className='mt-2 flex flex-wrap items-center gap-1 text-sm text-muted-foreground'>
        {change === null ? (
          <>No spending in {comparedWith} to compare with</>
        ) : (
          <>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                up ? "text-destructive" : "text-brand-strong",
              )}
            >
              {up ? (
                <ArrowUp className='size-3.5' />
              ) : (
                <ArrowDown className='size-3.5' />
              )}
              {Math.abs(Math.round(change * 100))}%
              <span className='sr-only'>{up ? "more" : "less"}</span>
            </span>
            than {comparedWith} ({formatAmount(previousTotal)})
          </>
        )}
      </p>
      <div className='mt-4 border-t pt-4'>
        <LimitProgress month={month} total={total} limit={limit} />
      </div>
      <dl className='mt-4 grid grid-cols-2 gap-3 border-t pt-4'>
        <div>
          <dt className='text-xs text-muted-foreground'>Daily average</dt>
          <dd className='mt-0.5 text-base font-medium text-foreground'>
            {formatAmount(Math.round(total / days))}
          </dd>
        </div>
        <div>
          <dt className='text-xs text-muted-foreground'>Expenses</dt>
          <dd className='mt-0.5 text-base font-medium text-foreground'>
            {count}
          </dd>
        </div>
      </dl>
    </section>
  );
}
