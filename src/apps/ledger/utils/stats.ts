import type { Dayjs } from "dayjs";
import { PARENT_CATEGORY, type ExpenseCategory } from "../constants/categories";
import type { Expense } from "../models/ledger";

export const sumAmounts = (expenses: Expense[]) =>
  expenses.reduce((sum, e) => sum + e.amount, 0);

// Total per day of `month` (index 0 = the 1st).
export function dailyTotals(expenses: Expense[], month: Dayjs): number[] {
  const totals = Array.from({ length: month.daysInMonth() }, () => 0);
  for (const e of expenses)
    totals[Number(e.spent_on.slice(8, 10)) - 1] += e.amount;
  return totals;
}

export type CategoryTotal = {
  category: ExpenseCategory;
  total: number;
  count: number;
};

// Totals per top-level category (subcategories roll up), largest first.
export function categoryTotals(expenses: Expense[]): CategoryTotal[] {
  const byParent = new Map<string, CategoryTotal>();
  for (const e of expenses) {
    const category = PARENT_CATEGORY.get(e.category_id);
    if (!category) continue;
    const row = byParent.get(category.id) ?? { category, total: 0, count: 0 };
    row.total += e.amount;
    row.count += 1;
    byParent.set(category.id, row);
  }
  return [...byParent.values()].sort((a, b) => b.total - a.total);
}

// A round axis maximum at or above `value`: 1, 2 or 5 × a power of ten.
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  return ([1, 2, 5, 10].find((m) => m * power >= value) ?? 10) * power;
}

// Total per month for the 12 months ending with `month`, oldest first.
export function monthlyTotals(
  expenses: Pick<Expense, "amount" | "spent_on">[],
  month: Dayjs,
): { month: Dayjs; total: number }[] {
  const months = Array.from({ length: 12 }, (_, i) =>
    month.subtract(11 - i, "month"),
  );
  const index = new Map(months.map((m, i) => [m.format("YYYY-MM"), i]));
  const totals = months.map(() => 0);
  for (const e of expenses) {
    const i = index.get(e.spent_on.slice(0, 7));
    if (i !== undefined) totals[i] += e.amount;
  }
  return months.map((m, i) => ({ month: m, total: totals[i] }));
}
