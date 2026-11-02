import { useCallback } from "react";
import { useSearchParams } from "react-router";
import { EXPENSE_CATEGORIES } from "../constants/categories";

const PARAM = "category";

const PARENT_IDS = new Set(EXPENSE_CATEGORIES.map((c) => c.id));

// The top-level category the expense list is filtered by, kept in the URL
// (?category=<id>) so it survives a reload. Missing, unknown or subcategory
// ids mean no filter; clearing it drops the param.
export function useCategoryParam(): [
  string | undefined,
  (id?: string) => void,
] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(PARAM);
  const category = raw && PARENT_IDS.has(raw) ? raw : undefined;

  const setCategory = useCallback(
    (next?: string) =>
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (next) updated.set(PARAM, next);
          else updated.delete(PARAM);
          return updated;
        },
        { replace: true },
      ),
    [setParams],
  );

  return [category, setCategory];
}
