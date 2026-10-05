import { Link } from "react-router";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { Button, Divider, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import { SidebarNavLink } from "@/components/molecules";
import { FOOTER_NAV, PLATFORM_NAV, appPath, ROUTES } from "@/constants";
import { useInstalledApps } from "@/hooks";
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
  const { t } = useTranslation();
  const { apps, isLoading } = useInstalledApps();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const toggleLabel = collapsed ? t("sidebar.expand") : t("sidebar.collapse");

  return (
    <nav aria-label={t("nav.main")} className='flex h-full flex-col bg-card'>
      <div className='flex-1 overflow-y-auto px-1.5 py-2'>
        <div className='flex flex-col gap-0.5'>
          {PLATFORM_NAV.map((item) => (
            <SidebarNavLink
              key={item.to}
              label={t(item.labelKey)}
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
          {!collapsed && (
            <div className='flex items-center justify-between px-2.5 pt-1 pb-1.5'>
              <span className='text-[11px] font-medium text-muted-foreground'>
                {t("sidebar.apps")}
              </span>
              <Link
                to={ROUTES.STORE}
                onClick={onNavigate}
                aria-label={t("sidebar.addApps")}
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
                  icon={app.icon}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
          {!isLoading && apps.length === 0 && !collapsed && (
            <p className='px-2.5 py-1.5 text-xs text-foreground-muted'>
              {t("sidebar.noApps")}
            </p>
          )}
        </div>

        <Divider className='my-2' />

        <div className='flex flex-col gap-0.5'>
          {FOOTER_NAV.map((item) => (
            <SidebarNavLink
              key={item.to}
              label={t(item.labelKey)}
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
