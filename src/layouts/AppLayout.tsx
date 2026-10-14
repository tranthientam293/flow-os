import { useEffect, useRef } from "react";
import { Outlet } from "react-router";
import {
  LaunchAppModal,
  MobileNav,
  Sidebar,
  TopBar,
} from "@/components/organisms";
import { APP_NAME } from "@/constants";
import { usePageTitle, useScrollTopOnNavigate } from "@/hooks";
import { useUiStore } from "@/stores";
import { cn } from "@/utils";

export function AppLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const title = usePageTitle();
  const mainRef = useRef<HTMLElement>(null);
  useScrollTopOnNavigate(mainRef);

  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);

  return (
    <div className='flex h-full flex-col'>
      <TopBar />
      <div className='flex min-h-0 flex-1'>
        <aside
          className={cn(
            "hidden shrink-0 border-r transition-[width] duration-150 md:block",
            collapsed ? "w-12" : "w-52",
          )}
        >
          <Sidebar collapsed={collapsed} showCollapseToggle />
        </aside>
        <main
          ref={mainRef}
          className='min-w-0 flex-1 overflow-y-auto bg-background'
        >
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <LaunchAppModal />
    </div>
  );
}
