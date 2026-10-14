import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { useFlowApp } from "@/context";
import {
  deleteExpenseMutationOptions,
  saveExpenseMutationOptions,
} from "../../apis/expenses";
import {
  ExpenseEditorContext,
  type ExpenseEditorContextValue,
} from "../../context/expense-editor-context";
import { useConfirmDelete } from "../../hooks/useConfirmDelete";
import type { Expense, ExpenseDraft } from "../../models/ledger";
import { ExpenseModal } from "./ExpenseModal";

type Target = {
  // Bumped on every open, so the modal (and its form) starts fresh each time.
  session?: number;
  expense?: Expense;
  onSaved?: (draft: ExpenseDraft) => void;
};

// One expense modal (add, edit, delete) for every page of the app.
export function ExpenseEditorProvider({ children }: { children: ReactNode }) {
  const { user } = useFlowApp();
  const save = useMutation(saveExpenseMutationOptions(user.id));
  const remove = useMutation(deleteExpenseMutationOptions(user.id));
  const { mutateAsync: deleteAsync } = remove;
  const { confirmDelete, holder } = useConfirmDelete();
  // `target` outlives `open` so the modal keeps its title and fields while
  // it fades out.
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<Target>({});
  const [headerAdd, setHeaderAddState] = useState<(() => void) | null>(null);
  // Stable, so effects that call it don't re-run when headerAdd changes.
  // Wrapped: a function passed to setState would be called as an updater.
  const setHeaderAdd = useCallback(
    (add: (() => void) | null) => setHeaderAddState(() => add),
    [],
  );

  const value = useMemo<ExpenseEditorContextValue>(
    () => ({
      openEditor: (expense, onSaved) => {
        setTarget((prev) => ({
          expense,
          onSaved,
          session: (prev.session ?? 0) + 1,
        }));
        setOpen(true);
      },
      deleteExpense: (expense) => confirmDelete(() => deleteAsync(expense.id)),
      headerAdd,
      setHeaderAdd,
    }),
    [confirmDelete, deleteAsync, headerAdd, setHeaderAdd],
  );

  const { expense, onSaved, session } = target;

  return (
    <ExpenseEditorContext.Provider value={value}>
      {holder}
      {children}
      <ExpenseModal
        // A new key per open: the form never shows the last expense's values.
        key={session}
        open={open}
        expense={expense}
        saving={save.isPending}
        onClose={() => setOpen(false)}
        onSubmit={(draft) =>
          save.mutate(
            { ...draft, id: expense?.id },
            {
              onSuccess: () => {
                setOpen(false);
                onSaved?.(draft);
              },
            },
          )
        }
        onDelete={() =>
          expense &&
          confirmDelete(async () => {
            await deleteAsync(expense.id);
            setOpen(false);
          })
        }
      />
    </ExpenseEditorContext.Provider>
  );
}
