import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router";
import { Tooltip } from "antd";
import { cn } from "@/utils";

type SidebarNavLinkProps = {
  label: string;
  to: string;
  icon: LucideIcon;
  collapsed?: boolean;
  end?: boolean;
  onNavigate?: () => void;
};

export function SidebarNavLink({
  label,
  to,
  icon: Icon,
  collapsed = false,
  end,
  onNavigate,
}: SidebarNavLinkProps) {
  const link = (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors pointer-coarse:h-10",
          isActive
            ? "bg-accent font-medium text-foreground"
            : "text-foreground-light hover:bg-accent/70 hover:text-foreground",
          collapsed && "justify-center px-0",
        )
      }
    >
      <Icon className='size-4.25 shrink-0' strokeWidth={1.5} />
      {!collapsed && <span className='truncate'>{label}</span>}
    </NavLink>
  );

  if (!collapsed) return link;
  return (
    <Tooltip title={label} placement='right' mouseEnterDelay={0.3}>
      {link}
    </Tooltip>
  );
}
