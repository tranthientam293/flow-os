import dayjs from "dayjs";
import { Link, useLocation } from "react-router";
import { ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/molecules";
import { DAY_FORMAT } from "@/constants";
import { CATEGORY_BY_ID } from "../../constants/categories";
import { useLedgerPaths } from "../../hooks/useLedgerPaths";
import type { Expense } from "../../models/ledger";
import { formatAmount } from "../../utils/money";
import { CategoryIcon } from "../atoms";

const SHOWN = 5;

// The latest expenses (newest first), to look at; edit them on Expenses.
export function RecentExpenses({ expenses }: { expenses: Expense[] }) {
  const paths = useLedgerPaths();
  // Keep the chosen month (?month=…) on the expense list.
  const { search } = useLocation();

  return (
    <section className='rounded-lg border bg-card'>
      <header className='flex items-center justify-between gap-3 px-4 pt-4 sm:px-5'>
        <h2 className='text-sm font-medium text-foreground'>Recent expenses</h2>
        <Link
          to={{ pathname: paths.expenses, search }}
          className='text-sm text-brand-strong hover:underline'
        >
          See all
        </Link>
      </header>
      {expenses.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title='No expenses to show'
          description='Expenses you add for this month appear here.'
          className='h-40 min-h-0 p-4 sm:p-5'
        />
      ) : (
        <ul className='mt-2 divide-y'>
          {expenses.slice(0, SHOWN).map((e) => {
            const category = CATEGORY_BY_ID.get(e.category_id);
            return (
              <li
                key={e.id}
                className='flex items-center gap-3 px-4 py-3 sm:px-5'
              >
                {category && <CategoryIcon category={category} size='lg' />}
                <span className='flex min-w-0 flex-1 flex-col'>
                  <span className='truncate text-sm font-medium text-foreground'>
                    {category?.name ?? e.category_id}
                  </span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {dayjs(e.spent_on).format(DAY_FORMAT)}
                    {e.note && ` · ${e.note}`}
                  </span>
                </span>
                <span className='shrink-0 text-sm font-medium text-foreground'>
                  {formatAmount(e.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
