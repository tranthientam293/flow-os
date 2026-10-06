import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router";
import { AlertTriangle, Download } from "lucide-react";
import { Button } from "antd";
import { useMutation } from "@tanstack/react-query";
import { CenteredSpinner } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";
import { ROUTES } from "@/constants";
import { useRequiredUser, FlowAppContext } from "@/context";
import { installAppMutationOptions } from "@/apis";
import { useInstalledApps } from "@/hooks";
import { supabase } from "@/libs";
import type { RegisteredApp } from "@/types";

export function AppHost({ app }: { app: RegisteredApp }) {
  const user = useRequiredUser();
  const { isInstalled, isLoading } = useInstalledApps();
  const install = useMutation(installAppMutationOptions(user.id));

  if (isLoading) return <CenteredSpinner />;

  if (!isInstalled(app.id)) {
    return (
      <EmptyState
        icon={app.icon}
        title={`${app.name} is not installed`}
        description={app.tagline}
        action={
          <div className='flex items-center gap-3'>
            <Button
              type='primary'
              size='small'
              icon={<Download />}
              loading={install.isPending}
              onClick={() => install.mutate(app.id)}
            >
              Install {app.name}
            </Button>
            <HomeLink />
          </div>
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

function HomeLink() {
  return (
    <Link
      to={ROUTES.HOME}
      className='text-sm text-foreground-light underline underline-offset-4 hover:text-foreground'
    >
      Go to Overview
    </Link>
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
        title={`${this.props.appName} stopped working`}
        description={this.state.error.message}
        action={
          <div className='flex items-center gap-3'>
            <Button size='small' onClick={() => this.setState({ error: null })}>
              Reload app
            </Button>
            <HomeLink />
          </div>
        }
      />
    );
  }
}
