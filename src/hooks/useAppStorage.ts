import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appStorageQueryOptions, setAppStorageMutationOptions } from "@/apis";
import { useFlowApp } from "@/context";
import type { AppStorageValue } from "@/models";

export function useAppStorage<T extends AppStorageValue>(
  key: string,
  initial: T,
) {
  const { app, user } = useFlowApp();
  const qc = useQueryClient();
  const [fallback] = useState(initial);
  const params = useMemo(
    () => ({ userId: user.id, appId: app.id, key }),
    [user.id, app.id, key],
  );
  const options = useMemo(
    () => appStorageQueryOptions(params, fallback),
    [params, fallback],
  );

  const query = useQuery(options);
  const { mutate, error: saveError } = useMutation(
    setAppStorageMutationOptions<T>(params),
  );

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = qc.getQueryData(options.queryKey) ?? fallback;
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      qc.setQueryData(options.queryKey, resolved);
      mutate(resolved);
    },
    [qc, options, mutate, fallback],
  );

  return [
    query.data ?? fallback,
    setValue,
    { isLoading: query.isLoading, error: query.error ?? saveError },
  ] as const;
}
