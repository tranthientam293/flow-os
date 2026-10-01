import { useEffect, useState } from "react";
import { Blocks, LayoutGrid, UserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { appRegistry } from "@/apps";
import { CopyButton, HealthDots, StatTile } from "@/components/molecules";
import { WorkspacePanel } from "@/components/organisms";
import { appPath, ROUTES } from "@/constants";
import { useRequiredUser } from "@/context";
import { useHealth, useInstalledApps } from "@/hooks";
import { profileQueryOptions } from "@/apis";
import { fromNow, supabase } from "@/libs";
import type { RegisteredApp } from "@/types";
import { healthLabelKey, getDisplayName } from "@/utils";

export function OverviewPage() {
  const { t } = useTranslation();
  const user = useRequiredUser();
  const { data: profile } = useQuery(profileQueryOptions(user.id));
  const { apps } = useInstalledApps();
  const health = useHealth();

  return (
    <div className='mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-2 lg:gap-10 lg:px-10 lg:py-12'>
      <section className='flex min-w-0 animate-fade-up flex-col justify-center'>
        <h1 className='text-2xl break-words text-foreground sm:text-3xl'>
          {t("overview.workspace", { name: getDisplayName(user, profile) })}
        </h1>
        <div className='mt-3 flex min-w-0 items-center gap-3 sm:mt-4'>
          <code className='min-w-0 truncate font-mono text-xs text-foreground-light sm:text-sm'>
            {user.id}
          </code>
          <CopyButton value={user.id} />
        </div>

        <div className='mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6'>
          <StatTile
            label={t("overview.status")}
            value={t(healthLabelKey(health))}
            iconSlot={<HealthDots health={health} />}
          />
          <StatTile
            label={t("overview.installedApps")}
            value={t("overview.installedCount", {
              installed: apps.length,
              total: appRegistry.length,
            })}
            icon={Blocks}
            to={ROUTES.STORE}
          />
          <StatTile
            label={t("overview.memberSince")}
            value={fromNow(user.created_at)}
            icon={UserRound}
            to={ROUTES.SETTINGS}
          />
          {apps.map((app) => (
            <AppSummaryTile key={app.id} app={app} userId={user.id} />
          ))}
          {apps.length < appRegistry.length && (
            <StatTile
              label={t("overview.appStore")}
              value={t("overview.browseMore")}
              icon={LayoutGrid}
              to={ROUTES.STORE}
            />
          )}
        </div>
      </section>

      <WorkspacePanel apps={apps} health={health} />
    </div>
  );
}

function AppSummaryTile({
  app,
  userId,
}: {
  app: RegisteredApp;
  userId: string;
}) {
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    if (!app.getSummary) return;
    let cancelled = false;
    app
      .getSummary({ supabase, userId })
      .then((s) => !cancelled && setSummary(s))
      .catch(() => !cancelled && setSummary(null));
    return () => {
      cancelled = true;
    };
  }, [app, userId]);

  return (
    <StatTile
      label={app.name}
      value={summary ?? app.tagline}
      icon={app.icon}
      to={appPath(app.id)}
    />
  );
}
