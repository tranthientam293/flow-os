import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { supabase } from "@/libs";
import type { AppStorageValue } from "@/models";

type AppStorageParams = { userId: string; appId: string; key: string };

export const appStorageQueryOptions = <T extends AppStorageValue>(
  { userId, appId, key }: AppStorageParams,
  fallback: T,
) =>
  queryOptions({
    queryKey: QUERY_KEYS.appStorage(userId, appId, key),
    queryFn: async (): Promise<T> => {
      const { data, error } = await supabase
        .from("app_storage")
        .select("value")
        .eq("app_id", appId)
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return data ? (data.value as T) : fallback;
    },
  });

export const setAppStorageMutationOptions = <T extends AppStorageValue>({
  userId,
  appId,
  key,
}: AppStorageParams) =>
  mutationOptions({
    mutationFn: async (value: T) => {
      const { error } = await supabase
        .from("app_storage")
        .upsert({ user_id: userId, app_id: appId, key, value });
      if (error) throw error;
    },
  });
