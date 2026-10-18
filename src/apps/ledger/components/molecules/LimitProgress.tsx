import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Link } from "react-router";
import { cn } from "@/utils";
import { useLedgerPaths } from "../../hooks/useLedgerPaths";
import { formatAmount } from "../../utils/money";

interface LimitProgressProps {
  month: Dayjs;
  total: number;
  limit: number | null;
}

export function LimitProgress({ month, total, limit }: LimitProgressProps) {
  const paths = useLedgerPaths();

  if (limit === null)
    return (
      <p className='text-sm text-muted-foreground'>
        No monthly limit.{" "}
        <Link to={paths.settings} className='text-brand-strong hover:underline'>
          Set one in Settings
        </Link>
      </p>
    );

  const over = total > limit;
  const share = Math.min(total / limit, 1);
  const current = month.isSame(dayjs(), "month");
  const daysLeft = month.daysInMonth() - dayjs().date() + 1;

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-3 text-sm'>
        <span className='text-muted-foreground'>
          {Math.round((total / limit) * 100)}% of {formatAmount(limit)}
        </span>
        <span
          className={cn(
            "font-medium",
            over ? "text-destructive" : "text-foreground",
          )}
        >
          {over
            ? `${formatAmount(total - limit)} over`
            : `${formatAmount(limit - total)} left`}
        </span>
      </div>
      <div aria-hidden className='h-2 overflow-hidden rounded-full bg-muted'>
        <div
          className={cn(
            "h-full rounded-full",
            over ? "bg-destructive" : "bg-brand",
          )}
          style={{ width: `${share * 100}%` }}
        />
      </div>
      {current && !over && (
        <p className='text-xs text-muted-foreground'>
          About {formatAmount(Math.floor((limit - total) / daysLeft))} a day for
          the {daysLeft === 1 ? "last day" : `${daysLeft} days left`}
        </p>
      )}
    </div>
  );
}
