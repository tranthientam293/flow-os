import { createContext, useContext, useEffect, useRef } from "react";

// What the phone bottom bar's round + does on the current page (e.g. create a
// session), or null when the page has nothing to add.
export type AddActionContextValue = {
  addAction: (() => void) | null;
  setAddAction: (action: (() => void) | null) => void;
};

export const AddActionContext = createContext<AddActionContextValue | null>(
  null,
);

export function useAddAction(): AddActionContextValue {
  const ctx = useContext(AddActionContext);
  if (!ctx)
    throw new Error("useAddAction must be used inside AddActionContext");
  return ctx;
}

// Offers `action` to the bottom bar's + while the calling component is mounted
// and `enabled` is true. The latest `action` always runs.
export function useRegisterAddAction(action: () => void, enabled = true) {
  const { setAddAction } = useAddAction();
  const latest = useRef(action);
  useEffect(() => {
    latest.current = action;
  });
  useEffect(() => {
    if (!enabled) return;
    setAddAction(() => latest.current());
    return () => setAddAction(null);
  }, [enabled, setAddAction]);
}
