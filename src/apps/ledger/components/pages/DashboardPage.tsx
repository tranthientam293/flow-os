import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Spin } from "antd";
import { useFlowApp } from "@/context";
import {
  monthExpensesQueryOptions,
  yearExpensesQueryOptions,
} from "../../apis/expenses";
import { settingsQueryOptions } from "../../apis/settings";
import { useExpenseEditor } from "../../context/expense-editor-context";
import { useMonthParam } from "../../hooks/useMonthParam";
import type { ExpenseDraft } from "../../models/ledger";
import {
  categoryTotals,
  dailyTotals,
  monthlyTotals,
  sumAmounts,
} from "../../utils/stats";
import { AddExpenseButton, MonthPicker, PageTitle } from "../molecules";
import {
  DailySpendingChart,
  MonthComparisonChart,
  RecentExpenses,
  SpendingSummary,
  TopCategories,
  YearSpendingChart,
} from "../organisms";

// The month at a glance, like Money Lover's home: total vs last month, daily
// spending, top categories and the latest expenses.
export function DashboardPage() {
  const { user } = useFlowApp();
  const [month, setMonth] = useMonthParam();
  const { openEditor } = useExpenseEditor();
  const previousMonth = month.subtract(1, "month");
  const expenses = useQuery(
    monthExpensesQueryOptions(user.id, month.format("YYYY-MM")),
  );
  const previous = useQuery(
    monthExpensesQueryOptions(user.id, previousMonth.format("YYYY-MM")),
  );

  const year = useQuery(
    yearExpensesQueryOptions(user.id, month.format("YYYY-MM")),
  );
  const settings = useQuery(settingsQueryOptions(user.id));
  const list = useMemo(() => expenses.data ?? [], [expenses.data]);
  const stats = useMemo(
    () => ({
      total: sumAmounts(list),
      daily: dailyTotals(list, month),
      categories: categoryTotals(list),
    }),
    [list, month],
  );
  // The whole previous month, for the comparison chart.
  const previousMonthTotal = useMemo(
    () => sumAmounts(previous.data ?? []),
    [previous.data],
  );
  // The current month is compared with the same days of last month (1st to
  // today's date); a past month with the whole previous month.
  const previousTotal = useMemo(() => {
    const rows = previous.data ?? [];
    if (!month.isSame(dayjs(), "month")) return sumAmounts(rows);
    const lastDay = month
      .subtract(1, "month")
      .date(dayjs().date())
      .format("YYYY-MM-DD");
    return sumAmounts(rows.filter((e) => e.spent_on <= lastDay));
  }, [previous.data, month]);

  const yearTotals = useMemo(
    () => monthlyTotals(year.data ?? [], month),
    [year.data, month],
  );

  const showMonthOf = (draft: ExpenseDraft) =>
    setMonth(draft.date.startOf("month"));

  return (
    <main className='mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-6 pb-6 sm:px-6'>
      <PageTitle title='Dashboard' description='Your month at a glance.' />
      <div className='flex items-center justify-between gap-3'>
        <MonthPicker value={month} onChange={setMonth} />
        <AddExpenseButton onClick={() => openEditor(undefined, showMonthOf)} />
      </div>

      {expenses.isLoading ||
      previous.isLoading ||
      settings.isLoading ||
      year.isLoading ? (
        <div className='flex justify-center py-12'>
          <Spin />
        </div>
      ) : (
        <>
          <SpendingSummary
            month={month}
            total={stats.total}
            count={list.length}
            previousTotal={previousTotal}
            limit={settings.data?.monthly_limit ?? null}
          />
          <MonthComparisonChart
            month={month}
            total={stats.total}
            previousTotal={previousMonthTotal}
          />
          <YearSpendingChart
            month={month}
            totals={yearTotals}
            onSelect={setMonth}
          />
          <DailySpendingChart month={month} totals={stats.daily} />
          <TopCategories totals={stats.categories} monthTotal={stats.total} />
          <RecentExpenses expenses={list} />
        </>
      )}
    </main>
  );
}
