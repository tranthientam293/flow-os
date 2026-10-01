import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { installedAppsQueryOptions } from "@/apis";
import { getApp } from "@/apps";
import { useRequiredUser } from "@/context";
import type { InstalledApp } from "@/models";
import type { RegisteredApp } from "@/types";

export type InstalledAppEntry = { app: RegisteredApp; record: InstalledApp };

export function useInstalledApps() {
  const user = useRequiredUser();
  const { data, isLoading, error } = useQuery(
    installedAppsQueryOptions(user.id),
  );

  return useMemo(() => {
    const entries: InstalledAppEntry[] = (data ?? []).flatMap((record) => {
      const app = getApp(record.app_id);
      return app ? [{ app, record }] : [];
    });
    const ids = new Set(entries.map((entry) => entry.app.id));
    return {
      entries,
      apps: entries.map((entry) => entry.app),
      isInstalled: (appId: string) => ids.has(appId),
      recordOf: (appId: string) =>
        entries.find((entry) => entry.app.id === appId)?.record,
      isLoading,
      error,
    };
  }, [data, isLoading, error]);
}
