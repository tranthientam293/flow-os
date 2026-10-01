import { createClient } from "@supabase/supabase-js";
import { ENV } from "@/constants";
import type { Database } from "@/models";

export const supabase = createClient<Database>(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export type SupabaseClient = typeof supabase;
