import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  AddActionContext,
  type AddActionContextValue,
} from "../../context/add-action-context";

// Holds what the phone bottom bar's + does on the current page.
export function AddActionProvider({ children }: { children: ReactNode }) {
  const [addAction, setAddActionState] = useState<(() => void) | null>(null);
  // Stable, so registering effects don't re-run. Wrapped: a function passed
  // to setState would be called as an updater.
  const setAddAction = useCallback(
    (action: (() => void) | null) => setAddActionState(() => action),
    [],
  );
  const value = useMemo<AddActionContextValue>(
    () => ({ addAction, setAddAction }),
    [addAction, setAddAction],
  );
  return (
    <AddActionContext.Provider value={value}>
      {children}
    </AddActionContext.Provider>
  );
}
