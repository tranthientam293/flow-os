import { useMemo } from "react";
import type { Dayjs } from "dayjs";
import { ChartColumn } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/molecules";
import { DAY_FORMAT } from "@/constants";
import { formatAmount, formatCompact } from "../../utils/money";
import { niceMax } from "../../utils/stats";

type Row = { day: number; total: number };

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11 };

const dayTicks = (last: number) =>
  Array.from({ length: last }, (_, i) => i + 1).filter(
    (day) => day === 1 || day === last || (day % 5 === 0 && last - day >= 2),
  );

interface DailySpendingChartProps {
  month: Dayjs;
  totals: number[];
}

export function DailySpendingChart({ month, totals }: DailySpendingChartProps) {
  const data = useMemo<Row[]>(
    () => totals.map((total, i) => ({ day: i + 1, total })),
    [totals],
  );
  const max = useMemo(() => niceMax(Math.max(...totals)), [totals]);
  const empty = totals.every((total) => total === 0);

  return (
    <section className='rounded-lg border bg-card p-4 sm:p-5'>
      <h2 className='text-sm font-medium text-foreground'>Daily spending</h2>
      {empty ? (
        <EmptyState
          icon={ChartColumn}
          title='No spending to show'
          description="Each day's spending appears here once you add expenses."
          className='mt-4 h-48 min-h-0 p-0 sm:p-0'
        />
      ) : (
        <div className='mt-4 h-48'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={data}
              margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
              barCategoryGap={1}
            >
              <CartesianGrid vertical={false} stroke='var(--border)' />
              <XAxis
                dataKey='day'
                ticks={dayTicks(totals.length)}
                interval={0}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: "var(--border-strong)" }}
              />
              <YAxis
                domain={[0, max]}
                ticks={[0, max / 2, max]}
                tickFormatter={formatCompact}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip
                cursor={{ fill: "var(--accent)" }}
                // Recharts fills in active and payload.
                content={<DayTooltip month={month} />}
              />
              <Bar
                dataKey='total'
                name='Spent'
                fill='var(--brand)'
                activeBar={{ fill: "var(--brand-strong)" }}
                radius={[4, 4, 0, 0]}
                maxBarSize={12}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

interface DayTooltipProps {
  active?: boolean;
  payload?: readonly { payload?: Row }[];
  month: Dayjs;
}

function DayTooltip({ active, payload, month }: DayTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className='rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-md'>
      <p className='text-muted-foreground'>
        {month.date(row.day).format(DAY_FORMAT)}
      </p>
      <p className='font-medium text-foreground'>{formatAmount(row.total)}</p>
    </div>
  );
}
