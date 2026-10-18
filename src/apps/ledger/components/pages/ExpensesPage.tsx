import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReceiptText } from "lucide-react";
import { Spin } from "antd";
import { EmptyState } from "@/components/molecules";
import { useFlowApp } from "@/context";
import { monthExpensesQueryOptions } from "../../apis/expenses";
import { useExpenseEditor } from "../../context/expense-editor-context";
import { useMonthParam } from "../../hooks/useMonthParam";
import type { ExpenseDraft } from "../../models/ledger";
import { formatAmount } from "../../utils/money";
import { sumAmounts } from "../../utils/stats";
import {
  AddExpenseButton,
  ExpenseList,
  MonthPicker,
  PageTitle,
} from "../molecules";

export function ExpensesPage() {
  const { user } = useFlowApp();
  const [month, setMonth] = useMonthParam();
  const { openEditor, deleteExpense } = useExpenseEditor();
  const expenses = useQuery(
    monthExpensesQueryOptions(user.id, month.format("YYYY-MM")),
  );

  const list = useMemo(() => expenses.data ?? [], [expenses.data]);
  const total = useMemo(() => sumAmounts(list), [list]);
  const showMonthOf = (draft: ExpenseDraft) =>
    setMonth(draft.date.startOf("month"));

  return (
    <main className='mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-6 pb-6 sm:px-6'>
      <PageTitle
        title='Expenses'
        description='Everything you spent this month, day by day.'
      />
      <div className='flex flex-col gap-3'>
        <div className='flex items-center gap-3'>
          <div className='min-w-0 flex-1'>
            <p className='text-xs text-muted-foreground'>Spent this month</p>
            <p className='truncate text-base font-semibold text-foreground tabular-nums'>
              {formatAmount(total)}
            </p>
          </div>
          <AddExpenseButton
            onClick={() => openEditor(undefined, showMonthOf)}
          />
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {expenses.isLoading ? (
        <div className='flex justify-center py-12'>
          <Spin />
        </div>
      ) : list.length ? (
        <ExpenseList
          expenses={list}
          onEdit={(e) => openEditor(e, showMonthOf)}
          onDelete={deleteExpense}
        />
      ) : (
        <EmptyState
          icon={ReceiptText}
          title='No expenses this month'
          description='Expenses you add for this month show up here.'
          className='flex-1'
        />
      )}
    </main>
  );
}
