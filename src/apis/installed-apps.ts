import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { getApp } from "@/apps";
import { QUERY_KEYS } from "@/constants";
import { i18n, queryClient, supabase } from "@/libs";
import type { InstalledApp } from "@/models";

const appName = (appId: unknown) =>
  getApp(String(appId))?.name ?? i18n.t("toast.fallbackAppName");

export const installedAppsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.installedApps(userId),
    queryFn: async (): Promise<InstalledApp[]> => {
      const { data, error } = await supabase
        .from("installed_apps")
        .select("*")
        .order("position");
      if (error) throw error;
      return data;
    },
  });

export const installAppMutationOptions = (userId: string) => {
  const { queryKey } = installedAppsQueryOptions(userId);
  return mutationOptions({
    mutationFn: async (appId: string): Promise<InstalledApp> => {
      const position = queryClient.getQueryData(queryKey)?.length ?? 0;
      const { data, error } = await supabase
        .from("installed_apps")
        .insert({ app_id: appId, position })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (record) =>
      queryClient.setQueryData(queryKey, (prev = []) => [...prev, record]),
    meta: {
      successMessage: (_data, appId) =>
        i18n.t("toast.appInstalled", { name: appName(appId) }),
      errorMessage: () => i18n.t("toast.installFailed"),
    },
  });
};

export const uninstallAppMutationOptions = (userId: string) => {
  const { queryKey } = installedAppsQueryOptions(userId);
  return mutationOptions({
    mutationFn: async (appId: string) => {
      const { error } = await supabase
        .from("installed_apps")
        .delete()
        .eq("app_id", appId);
      if (error) throw error;
    },
    onMutate: async (appId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (prev = []) =>
        prev.filter((record) => record.app_id !== appId),
      );
      return { previous };
    },
    onError: (_error, _appId, onMutateResult) => {
      if (onMutateResult?.previous)
        queryClient.setQueryData(queryKey, onMutateResult.previous);
    },
    meta: {
      successMessage: (_data, appId) =>
        i18n.t("toast.appUninstalled", { name: appName(appId) }),
      errorMessage: () => i18n.t("toast.uninstallFailed"),
    },
  });
};
