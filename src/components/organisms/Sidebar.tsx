import { Link } from "react-router";
import { Blocks, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { Button, Divider, Skeleton, Tooltip } from "antd";
import { SidebarNavLink } from "@/components/molecules";
import { FOOTER_NAV, PLATFORM_NAV, appPath, ROUTES } from "@/constants";
import { useInstalledApps, useLaunchApp } from "@/hooks";
import { useUiStore } from "@/stores";

type SidebarProps = {
  collapsed?: boolean;
  showCollapseToggle?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({
  collapsed = false,
  showCollapseToggle = false,
  onNavigate,
}: SidebarProps) {
  const { apps, isLoading } = useInstalledApps();
  const launchApp = useLaunchApp();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <nav aria-label='Main navigation' className='flex h-full flex-col bg-card'>
      <div className='flex-1 overflow-y-auto px-1.5 py-2'>
        <div className='flex flex-col gap-0.5'>
          {PLATFORM_NAV.map((item) => (
            <SidebarNavLink
              key={item.to}
              label={item.label}
              to={item.to}
              icon={item.icon}
              end={item.end}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <Divider className='my-2' />

        <div className='flex flex-col gap-0.5'>
          {collapsed ? (
            // Keeps the section recognisable when only icons show.
            <Tooltip title='Apps' placement='right' mouseEnterDelay={0.3}>
              <div className='flex h-6 items-center justify-center text-muted-foreground'>
                <Blocks className='size-3.5' strokeWidth={1.75} />
                <span className='sr-only'>Apps</span>
              </div>
            </Tooltip>
          ) : (
            <div className='flex items-center justify-between px-2.5 pt-1 pb-1.5'>
              <span className='flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground'>
                <Blocks className='size-3.5' strokeWidth={1.75} />
                Apps
              </span>
              <Link
                to={ROUTES.STORE}
                onClick={onNavigate}
                aria-label='Add apps'
                className='flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
              >
                <Plus className='size-3.5' />
              </Link>
            </div>
          )}
          {isLoading
            ? Array.from({ length: 3 }, (_, i) => (
                <Skeleton
                  key={i}
                  active
                  title={false}
                  paragraph={{ rows: 1, width: "100%" }}
                  className='px-2.5 py-2'
                />
              ))
            : apps.map((app) => (
                <SidebarNavLink
                  key={app.id}
                  label={app.name}
                  to={appPath(app.id)}
                  onClick={launchApp(app.id)}
                  icon={app.icon}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
          {!isLoading && apps.length === 0 && !collapsed && (
            <p className='px-2.5 py-1.5 text-xs text-foreground-muted'>
              No apps installed yet.
            </p>
          )}
        </div>

        <Divider className='my-2' />

        <div className='flex flex-col gap-0.5'>
          {FOOTER_NAV.map((item) => (
            <SidebarNavLink
              key={item.to}
              label={item.label}
              to={item.to}
              icon={item.icon}
              end={item.end}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>

      {showCollapseToggle && (
        <div className='border-t p-1.5'>
          <Button
            type='text'
            className='size-8'
            icon={collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            onClick={toggleSidebar}
            aria-label={toggleLabel}
            title={toggleLabel}
          />
        </div>
      )}
    </nav>
  );
}
