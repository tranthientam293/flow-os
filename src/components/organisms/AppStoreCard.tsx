import { Check, Download, Trash2 } from "lucide-react";
import { Button, Card } from "antd";
import { useMutation } from "@tanstack/react-query";
import { AppIcon, Badge } from "@/components/atoms";
import { installAppMutationOptions, uninstallAppMutationOptions } from "@/apis";
import { useRequiredUser } from "@/context";
import { useInstalledApps, useLaunchApp } from "@/hooks";
import type { RegisteredApp } from "@/types";
import { fromNow } from "@/libs";

export function AppStoreCard({ app }: { app: RegisteredApp }) {
  const launchApp = useLaunchApp();
  const { isInstalled, recordOf } = useInstalledApps();
  const user = useRequiredUser();
  const install = useMutation(installAppMutationOptions(user.id));
  const uninstall = useMutation(uninstallAppMutationOptions(user.id));
  const installed = isInstalled(app.id);
  const record = recordOf(app.id);

  return (
    <Card
      className='flex animate-fade-up flex-col transition-colors hover:border-border-strong'
      classNames={{ body: "flex flex-1 flex-col p-4" }}
    >
      <div className='flex items-start gap-3'>
        <AppIcon icon={app.icon} size='lg' />
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <h2 className='truncate text-sm font-medium text-foreground'>
              {app.name}
            </h2>
            {installed && (
              <Badge variant='brand'>
                <Check /> Installed
              </Badge>
            )}
          </div>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            {app.category} · v{app.version}
            {record && ` · added ${fromNow(record.installed_at)}`}
          </p>
        </div>
      </div>

      <p className='mt-3 flex-1 text-sm leading-relaxed text-foreground-light'>
        {app.description}
      </p>

      <div className='mt-4 flex items-center gap-2'>
        {installed ? (
          <>
            <Button size='small' onClick={launchApp(app.id)}>
              Open
            </Button>
            <Button
              type='text'
              size='small'
              icon={<Trash2 />}
              loading={uninstall.isPending}
              onClick={() => uninstall.mutate(app.id)}
            >
              Uninstall
            </Button>
          </>
        ) : (
          <Button
            type='primary'
            size='small'
            icon={<Download />}
            loading={install.isPending}
            onClick={() => install.mutate(app.id)}
          >
            Install
          </Button>
        )}
      </div>
    </Card>
  );
}
