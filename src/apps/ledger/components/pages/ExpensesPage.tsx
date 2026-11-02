import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReceiptText } from "lucide-react";
import { Spin } from "antd";
import { EmptyState } from "@/components/molecules";
import { useFlowApp } from "@/context";
import { monthExpensesQueryOptions } from "../../apis/expenses";
import { CATEGORY_BY_ID, PARENT_CATEGORY } from "../../constants/categories";
import { useExpenseEditor } from "../../context/expense-editor-context";
import { useCategoryParam } from "../../hooks/useCategoryParam";
import { useMonthParam } from "../../hooks/useMonthParam";
import type { ExpenseDraft } from "../../models/ledger";
import { formatAmount } from "../../utils/money";
import { sumAmounts } from "../../utils/stats";
import {
  AddExpenseButton,
  CategoryFilter,
  ExpenseList,
  MonthPicker,
  PageTitle,
} from "../molecules";

export function ExpensesPage() {
  const { user } = useFlowApp();
  const [month, setMonth] = useMonthParam();
  const [category, setCategory] = useCategoryParam();
  const { openEditor, deleteExpense } = useExpenseEditor();
  const expenses = useQuery(
    monthExpensesQueryOptions(user.id, month.format("YYYY-MM")),
  );

  // The filter is a top-level category; its subcategories match too.
  const list = useMemo(
    () =>
      (expenses.data ?? []).filter(
        (e) => !category || PARENT_CATEGORY.get(e.category_id)?.id === category,
      ),
    [expenses.data, category],
  );
  const categoryName = category && CATEGORY_BY_ID.get(category)?.name;
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
            <p className='truncate text-xs text-muted-foreground'>
              {categoryName
                ? `Spent on ${categoryName} this month`
                : "Spent this month"}
            </p>
            <p className='truncate text-base font-semibold text-foreground tabular-nums'>
              {formatAmount(total)}
            </p>
          </div>
          <AddExpenseButton
            onClick={() => openEditor(undefined, showMonthOf)}
          />
        </div>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <MonthPicker value={month} onChange={setMonth} />
          <CategoryFilter value={category} onChange={setCategory} />
        </div>
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
          title={
            categoryName
              ? `No ${categoryName} expenses this month`
              : "No expenses this month"
          }
          description={
            categoryName
              ? "Pick another category or clear the filter to see more."
              : "Expenses you add for this month show up here."
          }
          className='flex-1'
        />
      )}
    </main>
  );
}
