import { useMemo } from "react";
import type { Dayjs } from "dayjs";
import { ChartColumn } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/molecules";
import { formatAmount, formatCompact } from "../../utils/money";
import { niceMax } from "../../utils/stats";

type Row = { key: string; label: string; month: Dayjs; total: number };

const SELECTED_COLOR = "var(--brand)";
const OTHER_COLOR = "var(--muted-foreground)";
const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11 };
const LABEL_FORMAT = "MM/YYYY";

interface YearSpendingChartProps {
  month: Dayjs;
  /** Oldest first, ending with `month` (see monthlyTotals). */
  totals: { month: Dayjs; total: number }[];
  onSelect: (month: Dayjs) => void;
}

export function YearSpendingChart({
  month,
  totals,
  onSelect,
}: YearSpendingChartProps) {
  const data = useMemo<Row[]>(
    () =>
      totals.map((t) => ({
        key: t.month.format("YYYY-MM"),
        label: t.month.format(LABEL_FORMAT),
        month: t.month,
        total: t.total,
      })),
    [totals],
  );
  const max = useMemo(
    () => niceMax(Math.max(...totals.map((t) => t.total))),
    [totals],
  );
  const spent = totals.filter((t) => t.total > 0);
  const average = spent.length
    ? spent.reduce((sum, t) => sum + t.total, 0) / spent.length
    : 0;
  const selectedKey = month.format("YYYY-MM");

  return (
    <section className='rounded-lg border bg-card p-4 sm:p-5'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <h2 className='text-sm font-medium text-foreground'>Last 12 months</h2>
        {spent.length > 0 && (
          <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <span
              aria-hidden
              className='w-4 border-t border-dashed border-foreground-light'
            />
            Average {formatAmount(Math.round(average))} a month
          </p>
        )}
      </div>
      {spent.length === 0 ? (
        <EmptyState
          icon={ChartColumn}
          title='No spending this year'
          description='Each month’s total shows up here once you add expenses.'
          className='mt-4 h-52 min-h-0 p-0 sm:p-0'
        />
      ) : (
        <div className='mt-4 h-52'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={data}
              margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
              onClick={(state) => {
                const row = data[Number(state.activeTooltipIndex)];
                if (row) onSelect(row.month);
              }}
              className='cursor-pointer'
            >
              <CartesianGrid vertical={false} stroke='var(--border)' />
              <XAxis
                dataKey='label'
                interval='preserveStartEnd'
                minTickGap={6}
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
                content={<MonthTooltip />}
              />
              <ReferenceLine
                y={average}
                stroke='var(--foreground-light)'
                strokeDasharray='4 4'
                ifOverflow='extendDomain'
              />
              <Bar
                dataKey='total'
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              >
                {data.map((row) => (
                  <Cell
                    key={row.key}
                    fill={
                      row.key === selectedKey ? SELECTED_COLOR : OTHER_COLOR
                    }
                    fillOpacity={row.key === selectedKey ? 1 : 0.35}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

interface MonthTooltipProps {
  active?: boolean;
  payload?: readonly { payload?: Row }[];
}

function MonthTooltip({ active, payload }: MonthTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className='rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-md'>
      <p className='text-muted-foreground'>{row.month.format(LABEL_FORMAT)}</p>
      <p className='font-medium text-foreground'>{formatAmount(row.total)}</p>
    </div>
  );
}
