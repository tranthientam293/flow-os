import { useNavigate } from "react-router";
import { Check, Download, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AppIcon, Badge, Button, Card, Spinner } from "@/components/atoms";
import { appPath } from "@/constants";
import { installAppMutationOptions, uninstallAppMutationOptions } from "@/apis";
import { useRequiredUser } from "@/context";
import { useInstalledApps } from "@/hooks";
import type { RegisteredApp } from "@/types";
import { fromNow } from "@/libs";

export function AppStoreCard({ app }: { app: RegisteredApp }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isInstalled, recordOf } = useInstalledApps();
  const user = useRequiredUser();
  const install = useMutation(installAppMutationOptions(user.id));
  const uninstall = useMutation(uninstallAppMutationOptions(user.id));
  const installed = isInstalled(app.id);
  const record = recordOf(app.id);

  return (
    <Card className='animate-fade-up gap-0 p-4 shadow-none transition-colors hover:border-border-strong'>
      <div className='flex items-start gap-3'>
        <AppIcon icon={app.icon} size='lg' />
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <h2 className='truncate text-sm font-medium text-foreground'>
              {app.name}
            </h2>
            {installed && (
              <Badge variant='brand'>
                <Check /> {t("store.installed")}
              </Badge>
            )}
          </div>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            {t(`store.categories.${app.category}`)} · v{app.version}
            {record &&
              ` · ${t("store.added", { time: fromNow(record.installed_at) })}`}
          </p>
        </div>
      </div>

      <p className='mt-3 flex-1 text-sm leading-relaxed text-foreground-light'>
        {app.description}
      </p>

      <div className='mt-4 flex items-center gap-2'>
        {installed ? (
          <>
            <Button
              variant='outline'
              size='xs'
              onClick={() => navigate(appPath(app.id))}
            >
              {t("common.open")}
            </Button>
            <Button
              variant='ghost'
              size='xs'
              disabled={uninstall.isPending}
              onClick={() => uninstall.mutate(app.id)}
            >
              {uninstall.isPending ? (
                <Spinner className='size-3.5' />
              ) : (
                <Trash2 />
              )}
              {t("common.uninstall")}
            </Button>
          </>
        ) : (
          <Button
            size='xs'
            disabled={install.isPending}
            onClick={() => install.mutate(app.id)}
          >
            {install.isPending ? (
              <Spinner className='size-3.5 text-primary-foreground' />
            ) : (
              <Download />
            )}
            {t("common.install")}
          </Button>
        )}
      </div>
    </Card>
  );
}
