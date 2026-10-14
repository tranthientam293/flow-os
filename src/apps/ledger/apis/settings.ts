import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient, supabase } from "@/libs";
import { LEDGER_KEYS } from "../constants/keys";
import type { LedgerSettings } from "../models/ledger";
import { check } from "../utils/errors";

// The user's Ledger settings; null until they save something.
export const settingsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: LEDGER_KEYS.settings(userId),
    queryFn: async (): Promise<LedgerSettings | null> =>
      check(
        await supabase
          .from("ledger_settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
      ),
  });

// Sets the monthly spending limit in đồng; null removes it.
export const saveMonthlyLimitMutationOptions = (userId: string) =>
  mutationOptions({
    mutationFn: async (monthlyLimit: number | null): Promise<LedgerSettings> =>
      check(
        await supabase
          .from("ledger_settings")
          .upsert({ user_id: userId, monthly_limit: monthlyLimit })
          .select()
          .single(),
      ),
    onSuccess: (settings) =>
      queryClient.setQueryData(LEDGER_KEYS.settings(userId), settings),
    meta: { successMessage: "Limit saved", errorMessage: "Could not save" },
  });
