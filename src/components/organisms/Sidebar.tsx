import { Link } from "react-router";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Separator, Skeleton } from "@/components/atoms";
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

        <Separator className='my-2' />

        <div className='flex flex-col gap-0.5'>
          {!collapsed && (
            <div className='flex items-center justify-between px-2.5 pt-1 pb-1.5'>
              <span className='text-[11px] font-medium text-muted-foreground'>
                {t("sidebar.apps")}
              </span>
              <Button
                asChild
                variant='ghost'
                size='icon-xs'
                className='size-5 text-muted-foreground'
              >
                <Link
                  to={ROUTES.STORE}
                  onClick={onNavigate}
                  aria-label={t("sidebar.addApps")}
                >
                  <Plus />
                </Link>
              </Button>
            </div>
          )}
          {isLoading
            ? Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className='mx-2.5 my-2 h-4' />
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

        <Separator className='my-2' />

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
            variant='ghost'
            size='icon-sm'
            onClick={toggleSidebar}
            aria-label={toggleLabel}
            title={toggleLabel}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>
      )}
    </nav>
  );
}
