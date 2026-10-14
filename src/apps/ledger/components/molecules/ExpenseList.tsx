import { useMemo } from "react";
import dayjs from "dayjs";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "antd";
import { DAY_FORMAT } from "@/constants";
import { CATEGORY_BY_ID } from "../../constants/categories";
import type { Expense } from "../../models/ledger";
import { formatAmount } from "../../utils/money";
import { CategoryIcon } from "../atoms";

// Expenses grouped by day, newest first, each day with its total. Each
// expense has Edit and Delete buttons (Delete is confirmed by the caller);
// the row itself isn't clickable.
// Expects expenses already sorted by spent_on descending.
export function ExpenseList({
  expenses,
  onEdit,
  onDelete,
}: {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}) {
  // [day, its expenses, their total], in the order given.
  const days = useMemo(() => {
    const byDay = new Map<string, Expense[]>();
    for (const e of expenses)
      byDay.set(e.spent_on, [...(byDay.get(e.spent_on) ?? []), e]);
    return [...byDay].map(
      ([day, items]) =>
        [day, items, items.reduce((sum, e) => sum + e.amount, 0)] as const,
    );
  }, [expenses]);

  return (
    <div className='flex flex-col gap-4'>
      {days.map(([day, items, total]) => (
        <section
          key={day}
          className='overflow-hidden rounded-lg border bg-card'
        >
          <header className='flex items-center justify-between gap-3 border-b bg-surface-muted px-4 py-2 text-sm'>
            <span className='font-medium text-foreground'>
              {dayjs(day).format(DAY_FORMAT)}
            </span>
            <span className='text-foreground-light tabular-nums'>
              {formatAmount(total)}
            </span>
          </header>
          <ul className='divide-y'>
            {items.map((e) => {
              const category = CATEGORY_BY_ID.get(e.category_id);
              return (
                <li key={e.id} className='flex items-center gap-1 pe-2'>
                  <div className='flex min-w-0 flex-1 items-center gap-3 py-3 ps-4'>
                    {category && <CategoryIcon category={category} size='lg' />}
                    <span className='flex min-w-0 flex-1 flex-col'>
                      <span className='truncate text-sm font-medium text-foreground'>
                        {category?.name ?? e.category_id}
                      </span>
                      {e.note && (
                        <span className='truncate text-xs text-muted-foreground'>
                          {e.note}
                        </span>
                      )}
                    </span>
                    <span className='shrink-0 text-sm font-medium text-foreground tabular-nums'>
                      {formatAmount(e.amount)}
                    </span>
                  </div>
                  <Button
                    type='text'
                    size='small'
                    icon={<Pencil />}
                    title='Edit'
                    aria-label='Edit expense'
                    onClick={() => onEdit(e)}
                  />
                  <Button
                    type='text'
                    size='small'
                    danger
                    icon={<Trash2 />}
                    title='Delete'
                    aria-label='Delete expense'
                    onClick={() => onDelete(e)}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
