import { queryOptions } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { supabase } from "@/libs";

export const healthQueryOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.health,
    queryFn: async (): Promise<number> => {
      const started = performance.now();
      const { error } = await supabase
        .from("installed_apps")
        .select("app_id", { head: true, count: "exact" });
      if (error) throw error;
      return Math.round(performance.now() - started);
    },
    refetchInterval: 60_000,
    retry: 0,
  });
