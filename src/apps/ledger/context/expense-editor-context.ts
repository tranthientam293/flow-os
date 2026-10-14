import { createContext, useContext } from "react";
import type { Expense, ExpenseDraft } from "../models/ledger";

export type ExpenseEditorContextValue = {
  // Opens the expense modal: empty to add one, or filled in to edit
  // `expense`. `onSaved` runs after a successful save.
  openEditor: (
    expense?: Expense,
    onSaved?: (draft: ExpenseDraft) => void,
  ) => void;
  // Asks for confirmation, then deletes the expense.
  deleteExpense: (expense: Expense) => void;
  // Set while a page's Add expense button is scrolled out of view: the
  // header then shows its own Add expense, which runs this.
  headerAdd: (() => void) | null;
  setHeaderAdd: (add: (() => void) | null) => void;
};

export const ExpenseEditorContext =
  createContext<ExpenseEditorContextValue | null>(null);

export function useExpenseEditor(): ExpenseEditorContextValue {
  const ctx = useContext(ExpenseEditorContext);
  if (!ctx)
    throw new Error(
      "useExpenseEditor must be used inside ExpenseEditorProvider",
    );
  return ctx;
}
