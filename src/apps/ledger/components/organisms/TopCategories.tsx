import { useMemo } from "react";
import { ChartPie, Ellipsis } from "lucide-react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { EmptyState } from "@/components/molecules";
import {
  CATEGORY_TONE_COLOR,
  type ExpenseCategory,
} from "../../constants/categories";
import { OTHER_SLICE_COLOR } from "../../constants/chart";
import { formatAmount } from "../../utils/money";
import type { CategoryTotal } from "../../utils/stats";
import { CategoryIcon } from "../atoms";

const SHOWN = 5;
const PIE_SIZE = 176;

const EVERYTHING_ELSE: ExpenseCategory = {
  id: "everything-else",
  name: "Everything else",
  icon: Ellipsis,
  tone: "slate",
};

type Row = CategoryTotal & { color: string; share: number };

interface TopCategoriesProps {
  totals: CategoryTotal[];
  monthTotal: number;
}

export function TopCategories({ totals, monthTotal }: TopCategoriesProps) {
  const rows = useMemo<Row[]>(() => {
    const top =
      totals.length <= SHOWN + 1
        ? totals
        : [
            ...totals.slice(0, SHOWN),
            {
              category: EVERYTHING_ELSE,
              total: totals.slice(SHOWN).reduce((sum, r) => sum + r.total, 0),
              count: totals.slice(SHOWN).reduce((sum, r) => sum + r.count, 0),
            },
          ];
    return top.map((row) => ({
      ...row,
      color:
        row.category === EVERYTHING_ELSE
          ? OTHER_SLICE_COLOR
          : CATEGORY_TONE_COLOR[row.category.tone],
      share: row.total / monthTotal,
    }));
  }, [totals, monthTotal]);

  return (
    <section className='rounded-lg border bg-card p-4 sm:p-5'>
      <h2 className='text-sm font-medium text-foreground'>Top spending</h2>
      {rows.length === 0 ? (
        <EmptyState
          icon={ChartPie}
          title='No spending to show'
          description='Your top categories and their share of the month appear here once you add expenses.'
          className='mt-4 h-44 min-h-0 p-0 sm:p-0'
        />
      ) : (
        <div className='mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center'>
          <div className='relative shrink-0' style={{ width: PIE_SIZE }}>
            <PieChart width={PIE_SIZE} height={PIE_SIZE}>
              <Pie
                data={rows}
                dataKey='total'
                nameKey='category.name'
                innerRadius={58}
                outerRadius={86}
                startAngle={90}
                endAngle={-270}
                stroke='var(--card)'
                strokeWidth={2}
                isAnimationActive={false}
              >
                {rows.map((row) => (
                  <Cell key={row.category.id} fill={row.color} />
                ))}
              </Pie>
              {/* Recharts fills in active and payload. */}
              <Tooltip content={<SliceTooltip />} />
            </PieChart>
            <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center'>
              <span className='text-xs text-muted-foreground'>Total</span>
              <span className='text-sm font-semibold text-foreground'>
                {formatAmount(monthTotal)}
              </span>
            </div>
          </div>

          <ul className='flex w-full min-w-0 flex-1 flex-col gap-4'>
            {rows.map(({ category, total, share }) => (
              <li key={category.id} className='flex items-center gap-3'>
                <CategoryIcon category={category} size='lg' />
                <div className='flex min-w-0 flex-1 items-center gap-2 text-sm'>
                  <span className='min-w-0 flex-1 truncate text-foreground'>
                    {category.name}
                  </span>
                  <span className='shrink-0 font-medium text-foreground'>
                    {formatAmount(total)}
                  </span>
                  <span className='w-9 shrink-0 text-end text-xs text-muted-foreground'>
                    {Math.round(share * 100)}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

interface SliceTooltipProps {
  active?: boolean;
  payload?: readonly { payload?: Row }[];
}

function SliceTooltip({ active, payload }: SliceTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className='rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-md'>
      <p className='flex items-center gap-1.5 text-muted-foreground'>
        <span
          aria-hidden
          className='size-2 rounded-full'
          style={{ background: row.color }}
        />
        {row.category.name}
      </p>
      <p className='font-medium text-foreground'>
        {formatAmount(row.total)} · {Math.round(row.share * 100)}%
      </p>
    </div>
  );
}
