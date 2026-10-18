import { useMemo } from "react";
import type { Dayjs } from "dayjs";
import { ChartColumnBig } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/molecules";
import { formatCompact } from "../../utils/money";
import { niceMax } from "../../utils/stats";

type Row = { label: string; total: number; color: string };

const CURRENT_COLOR = "var(--brand)";
const PREVIOUS_COLOR = "var(--muted-foreground)";
const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };

const monthLabel = (m: Dayjs) => m.format("MM/YYYY");

interface MonthComparisonChartProps {
  month: Dayjs;
  total: number;
  /** The whole previous month. */
  previousTotal: number;
}

export function MonthComparisonChart({
  month,
  total,
  previousTotal,
}: MonthComparisonChartProps) {
  const data = useMemo<Row[]>(
    () => [
      {
        label: monthLabel(month.subtract(1, "month")),
        total: previousTotal,
        color: PREVIOUS_COLOR,
      },
      {
        label: monthLabel(month),
        total,
        color: CURRENT_COLOR,
      },
    ],
    [month, total, previousTotal],
  );
  const max = niceMax(Math.max(total, previousTotal));
  const empty = total === 0 && previousTotal === 0;

  return (
    <section className='rounded-lg border bg-card p-4 sm:p-5'>
      <h2 className='text-sm font-medium text-foreground'>
        Compared with last month
      </h2>
      {empty ? (
        <EmptyState
          icon={ChartColumnBig}
          title='No spending in either month'
          description="This month's total shows up here next to last month's."
          className='mt-4 h-52 min-h-0 p-0 sm:p-0'
        />
      ) : (
        <div className='mt-4 h-52'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={data}
              margin={{ top: 20, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke='var(--border)' />
              <XAxis
                dataKey='label'
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: "var(--border-strong)" }}
              />
              <YAxis
                domain={[0, max]}
                ticks={[0, max / 2, max]}
                tickFormatter={formatCompact}
                tick={{ ...AXIS_TICK, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Bar
                dataKey='total'
                maxBarSize={56}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              >
                {data.map((row) => (
                  <Cell key={row.label} fill={row.color} />
                ))}
                <LabelList
                  dataKey='total'
                  position='top'
                  formatter={(value) => formatCompact(Number(value))}
                  fill='var(--foreground)'
                  fontSize={12}
                  fontWeight={500}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
