import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button, CenteredSpinner, Spinner } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";
import { useRequiredUser, FlowAppContext } from "@/context";
import { installAppMutationOptions } from "@/apis";
import { useInstalledApps } from "@/hooks";
import { i18n, supabase } from "@/libs";
import type { RegisteredApp } from "@/types";

export function AppHost({ app }: { app: RegisteredApp }) {
  const { t } = useTranslation();
  const user = useRequiredUser();
  const { isInstalled, isLoading } = useInstalledApps();
  const install = useMutation(installAppMutationOptions(user.id));

  if (isLoading) return <CenteredSpinner />;

  if (!isInstalled(app.id)) {
    return (
      <EmptyState
        icon={app.icon}
        title={t("appHost.notInstalled", { name: app.name })}
        description={app.tagline}
        action={
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
            {t("appHost.install", { name: app.name })}
          </Button>
        }
      />
    );
  }

  return (
    <FlowAppContext.Provider value={{ app, user, supabase }}>
      <AppErrorBoundary key={app.id} appName={app.name}>
        <Suspense fallback={<CenteredSpinner />}>
          <app.Component />
        </Suspense>
      </AppErrorBoundary>
    </FlowAppContext.Provider>
  );
}

type BoundaryProps = { appName: string; children: ReactNode };

class AppErrorBoundary extends Component<
  BoundaryProps,
  { error: Error | null }
> {
  override state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[flowOS] ${this.props.appName} crashed`,
      error,
      info.componentStack,
    );
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <EmptyState
        icon={AlertTriangle}
        tone='destructive'
        title={i18n.t("appHost.crashed", { name: this.props.appName })}
        description={this.state.error.message}
        action={
          <Button
            variant='outline'
            size='xs'
            onClick={() => this.setState({ error: null })}
          >
            {i18n.t("appHost.reload")}
          </Button>
        }
      />
    );
  }
}
