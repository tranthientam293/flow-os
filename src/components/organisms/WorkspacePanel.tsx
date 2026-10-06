import { Link } from "react-router";
import { Database } from "lucide-react";
import { AppIcon } from "@/components/atoms";
import { APP_NAME, BACKEND_REGION_CODE, appPath } from "@/constants";
import { useLaunchApp } from "@/hooks";
import type { HealthStatus, RegisteredApp } from "@/types";

export function WorkspacePanel({
  apps,
  health,
}: {
  apps: RegisteredApp[];
  health: HealthStatus;
}) {
  const launchApp = useLaunchApp();
  return (
    <section
      aria-label='Workspace diagram'
      className='relative flex min-h-75 flex-col items-center justify-center overflow-hidden rounded-xl border dot-grid p-5 sm:min-h-105 sm:p-8'
    >
      <div className='w-full max-w-xs animate-fade-up rounded-lg border bg-card shadow-sm'>
        <div className='flex items-start gap-3 p-3'>
          <div className='flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground'>
            <Database className='size-4' strokeWidth={1.75} />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='text-sm text-foreground'>{APP_NAME} core</div>
            <div className='text-xs text-muted-foreground'>
              Supabase · South Asia (Mumbai)
            </div>
            <div className='text-xs text-muted-foreground'>
              {BACKEND_REGION_CODE}
            </div>
          </div>
        </div>
        <div className='flex items-center gap-2 border-t px-3 py-2 font-mono text-[11px] text-muted-foreground'>
          <span>
            {"Apps"}{" "}
            <span className='text-foreground-light'>{apps.length}</span>
          </span>
          <span>·</span>
          <span>
            {"Latency"}{" "}
            <span className='text-foreground-light'>
              {health.state === "healthy" ? `${health.latencyMs}ms` : "—"}
            </span>
          </span>
        </div>
      </div>

      {apps.length > 0 && (
        <>
          <div className='h-8 w-px bg-border-strong' />
          <div className='flex max-w-full flex-wrap justify-center gap-2 border-t border-border-strong pt-4'>
            {apps.map((app) => (
              <Link
                key={app.id}
                to={appPath(app.id)}
                onClick={launchApp(app.id)}
                className='flex items-center gap-2 rounded-md border bg-card py-1.5 pr-3 pl-1.5 text-xs text-foreground-light shadow-sm transition-colors hover:border-border-strong hover:text-foreground'
              >
                <AppIcon icon={app.icon} size='sm' />
                {app.name}
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
