import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@/libs";
import type { AppManifest } from "@/types";

export type FlowAppContextValue = {
  app: AppManifest;
  user: User;
  supabase: SupabaseClient;
};

export const FlowAppContext = createContext<FlowAppContextValue | null>(null);

export function useFlowApp(): FlowAppContextValue {
  const ctx = useContext(FlowAppContext);
  if (!ctx)
    throw new Error("useFlowApp must be used inside an app rendered by flowOS");
  return ctx;
}
