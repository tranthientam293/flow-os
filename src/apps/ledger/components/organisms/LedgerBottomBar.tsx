import type { ReactNode } from "react";
import {
  LayoutDashboard,
  type LucideIcon,
  PiggyBank,
  Plus,
  ReceiptText,
  Settings,
} from "lucide-react";
import { NavLink, useLocation } from "react-router";
import { Button } from "antd";
import { cn } from "@/utils";
import { useExpenseEditor } from "../../context/expense-editor-context";
import { useLedgerPaths } from "../../hooks/useLedgerPaths";
import { useMonthParam } from "../../hooks/useMonthParam";

export function LedgerBottomBar() {
  const paths = useLedgerPaths();
  const { search } = useLocation();
  const [, setMonth] = useMonthParam();
  const { openEditor } = useExpenseEditor();

  return (
    <nav
      aria-label='Ledger'
      className='fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] sm:hidden'
    >
      <Tab to={{ pathname: paths.base, search }} icon={LayoutDashboard}>
        Dashboard
      </Tab>
      <Tab to={{ pathname: paths.expenses, search }} icon={ReceiptText}>
        Expenses
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
          aria-label='Add expense'
          title='Add expense'
          icon={<Plus className='size-6!' strokeWidth={2.5} />}
          onClick={() =>
            openEditor(undefined, (draft) =>
              setMonth(draft.date.startOf("month")),
            )
          }
          className='absolute -top-5 left-1/2 size-14 -translate-x-1/2 ring-4 ring-brand-soft'
        />
      </div>
      {/* Funds stays active on a fund's own page. */}
      <Tab to={paths.funds} icon={PiggyBank} end={false}>
        Funds
      </Tab>
      {/* Back to flowOS lives in Settings. */}
      <Tab to={paths.settings} icon={Settings}>
        Settings
      </Tab>
    </nav>
  );
}

const TAB_CLASS =
  "flex h-16 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground outline-none focus-visible:bg-accent";

interface TabProps {
  to: string | { pathname: string; search: string };
  icon: LucideIcon;
  end?: boolean;
  children: ReactNode;
}

function Tab({ to, icon: Icon, end = true, children }: TabProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(TAB_CLASS, isActive && "font-medium text-brand-strong")
      }
    >
      <Icon className='size-5' />
      {children}
    </NavLink>
  );
}
