import type { ReactNode } from "react";
import {
  Building2,
  CalendarCheck,
  LogOut,
  type LucideIcon,
  Plus,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router";
import { Button } from "antd";
import { APP_NAME } from "@/constants";
import { useBackToPlatform } from "@/hooks";
import { cn } from "@/utils";
import { ROSTER_LEAVE_NOTE } from "../../constants/options";
import { useAddAction } from "../../context/add-action-context";
import { useRosterPaths } from "../../hooks/useRosterPaths";

export function RosterBottomBar() {
  const paths = useRosterPaths();
  const { addAction } = useAddAction();
  const { backToPlatform, holder } = useBackToPlatform(ROSTER_LEAVE_NOTE);

  return (
    <nav
      aria-label='Roster'
      className='fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] sm:hidden'
    >
      {holder}
      <Tab to={paths.section("centers")} icon={Building2}>
        Centers
      </Tab>
      <Tab to={paths.section("work")} icon={CalendarCheck}>
        My schedule
      </Tab>
      <div className='relative'>
        {/* The bar's top edge bulges around the raised button: the top of a
            72px card-colored circle with the bar's border, clipped at the
            bar's edge (it also hides the bar's border line under it). */}
        <div
          aria-hidden
          className='absolute -top-7 left-1/2 h-7 w-18 -translate-x-1/2 overflow-hidden'
        >
          <div className='size-18 rounded-full border bg-card' />
        </div>
        <Button
          type='primary'
          shape='circle'
          aria-label='Create session'
          title={addAction ? "Create session" : "Open a schedule to create"}
          icon={<Plus className='size-6!' strokeWidth={2.5} />}
          disabled={!addAction}
          onClick={() => addAction?.()}
          className='absolute -top-5 left-1/2 size-14 -translate-x-1/2 ring-4 ring-brand-soft'
        />
      </div>
      <Tab to={paths.settings} icon={Settings}>
        Settings
      </Tab>
      <button type='button' onClick={backToPlatform} className={TAB_CLASS}>
        <LogOut className='size-5' />
        {APP_NAME}
      </button>
    </nav>
  );
}

const TAB_CLASS =
  "flex h-16 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 px-1 text-center text-[11px] leading-tight text-muted-foreground outline-none focus-visible:bg-accent";

interface TabProps {
  to: string;
  icon: LucideIcon;
  children: ReactNode;
}

function Tab({ to, icon: Icon, children }: TabProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(TAB_CLASS, isActive && "font-medium text-brand-strong")
      }
    >
      <Icon className='size-5 shrink-0' />
      <span className='truncate'>{children}</span>
    </NavLink>
  );
}
