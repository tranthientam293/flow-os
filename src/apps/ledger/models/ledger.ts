import type { Dayjs } from "dayjs";
import type { Tables, TablesInsert } from "@/models";

export type Expense = Tables<"ledger_expenses">;
export type ExpenseInsert = TablesInsert<"ledger_expenses">;

// What the expense modal collects.
export interface ExpenseDraft {
  amount: number;
  categoryId: string;
  note?: string;
  date: Dayjs;
}

export type LedgerSettings = Tables<"ledger_settings">;
