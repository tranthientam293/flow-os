import { mutationOptions, queryOptions } from "@tanstack/react-query";
import dayjs from "dayjs";
import { queryClient, supabase } from "@/libs";
import { LEDGER_KEYS } from "../constants/keys";
import type { Expense, ExpenseDraft, ExpenseInsert } from "../models/ledger";
import { check } from "../utils/errors";

// Dates are stored as plain days (YYYY-MM-DD), in the user's local calendar.
const DAY = "YYYY-MM-DD";

// Rows per request (Supabase's default cap).
const PAGE = 1000;

const toRow = (draft: ExpenseDraft): ExpenseInsert => ({
  amount: draft.amount,
  category_id: draft.categoryId,
  note: draft.note ?? null,
  spent_on: draft.date.format(DAY),
});

const refreshExpenses = (userId: string) =>
  queryClient.invalidateQueries({ queryKey: LEDGER_KEYS.expenses(userId) });

// The user's expenses in one month (YYYY-MM), newest day first.
export const monthExpensesQueryOptions = (userId: string, month: string) =>
  queryOptions({
    queryKey: LEDGER_KEYS.monthExpenses(userId, month),
    queryFn: async (): Promise<Expense[]> => {
      const start = dayjs(`${month}-01`);
      return check(
        await supabase
          .from("ledger_expenses")
          .select("*")
          .eq("user_id", userId)
          .gte("spent_on", start.format(DAY))
          .lt("spent_on", start.add(1, "month").format(DAY))
          .order("spent_on", { ascending: false })
          .order("created_at", { ascending: false }),
      );
    },
  });

// Adds an expense, or updates it when `id` is given.
export const saveExpenseMutationOptions = (userId: string) =>
  mutationOptions({
    mutationFn: async ({
      id,
      ...draft
    }: ExpenseDraft & { id?: string }): Promise<Expense> =>
      id
        ? check(
            await supabase
              .from("ledger_expenses")
              .update(toRow(draft))
              .eq("id", id)
              .select()
              .single(),
          )
        : check(
            await supabase
              .from("ledger_expenses")
              .insert(toRow(draft))
              .select()
              .single(),
          ),
    onSuccess: () => refreshExpenses(userId),
    meta: { successMessage: "Expense saved", errorMessage: "Could not save" },
  });

export const deleteExpenseMutationOptions = (userId: string) =>
  mutationOptions({
    mutationFn: async (id: string) => {
      check(await supabase.from("ledger_expenses").delete().eq("id", id));
    },
    onSuccess: () => refreshExpenses(userId),
    meta: {
      successMessage: "Expense deleted",
      errorMessage: "Could not delete",
    },
  });

// Amount and day of every expense in the 12 months ending with `month`
// (YYYY-MM), for the yearly chart.
export const yearExpensesQueryOptions = (userId: string, month: string) =>
  queryOptions({
    queryKey: LEDGER_KEYS.yearExpenses(userId, month),
    queryFn: async () => {
      const end = dayjs(`${month}-01`).add(1, "month");
      const rows: Pick<Expense, "amount" | "spent_on">[] = [];
      // The API returns at most PAGE rows per request; a year can hold more.
      for (let from = 0; ; from += PAGE) {
        const page = check(
          await supabase
            .from("ledger_expenses")
            .select("amount, spent_on")
            .eq("user_id", userId)
            .gte("spent_on", end.subtract(12, "month").format(DAY))
            .lt("spent_on", end.format(DAY))
            .order("id")
            .range(from, from + PAGE - 1),
        );
        rows.push(...page);
        if (page.length < PAGE) return rows;
      }
    },
  });
