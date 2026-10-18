import { House, Plus, Settings, UserRound, Wallet } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { Avatar, Button, Dropdown } from "antd";
import { APP_NAME } from "@/constants";
import { useFlowApp } from "@/context";
import { useBackToPlatform } from "@/hooks";
import { cn } from "@/utils";
import { SECTIONS } from "../../constants/routes";
import { useExpenseEditor } from "../../context/expense-editor-context";
import { useLedgerPaths } from "../../hooks/useLedgerPaths";

export function LedgerHeader() {
  const { app } = useFlowApp();
  const paths = useLedgerPaths();
  const { search } = useLocation();

  return (
    <header className='sticky top-0 z-20 hidden h-14 shrink-0 items-center gap-2 border-b bg-card px-2 sm:flex sm:gap-4 sm:px-4'>
      <Link
        to={paths.base}
        className='flex items-center gap-2 rounded-md text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
      >
        <Wallet className='size-4 text-brand-strong' />
        <span className='hidden sm:inline'>{app.name}</span>
      </Link>
      <nav aria-label='Ledger' className='flex min-w-0 items-center gap-1'>
        {SECTIONS.map((s) => (
          <NavLink
            key={s.path}
            to={{ pathname: paths.section(s.path), search }}
            end
            className={({ isActive }) =>
              cn(
                "shrink-0 rounded-md px-2.5 py-1.5 text-sm text-foreground-light transition-colors hover:bg-accent hover:text-foreground",
                isActive && "bg-accent font-medium text-foreground",
              )
            }
          >
            {s.label}
          </NavLink>
        ))}
      </nav>
      <div className='ms-auto flex items-center gap-2'>
        <HeaderAddButton />
        <AccountMenu />
      </div>
    </header>
  );
}

function AccountMenu() {
  const { user } = useFlowApp();
  const navigate = useNavigate();
  const paths = useLedgerPaths();
  const { backToPlatform, holder } = useBackToPlatform();

  return (
    <>
      {holder}
      <Dropdown
        trigger={["click"]}
        placement='bottomRight'
        menu={{
          className: "w-56",
          items: [
            {
              key: "account",
              type: "group",
              label: (
                <span className='block truncate text-xs text-muted-foreground'>
                  {user.email}
                </span>
              ),
            },
            { type: "divider" },
            {
              key: "settings",
              icon: <Settings />,
              label: "Settings",
              onClick: () => navigate(paths.settings),
            },
            {
              key: "back",
              icon: <House />,
              label: `Back to ${APP_NAME}`,
              onClick: backToPlatform,
            },
          ],
        }}
      >
        <button
          type='button'
          className='flex size-8 cursor-pointer items-center justify-center rounded-md outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50'
          aria-label='Account menu'
        >
          <Avatar
            size={24}
            icon={<UserRound className='size-3.5' strokeWidth={2} />}
            className='bg-foreground text-background'
          />
        </button>
      </Dropdown>
    </>
  );
}

function HeaderAddButton() {
  const { headerAdd } = useExpenseEditor();
  if (!headerAdd) return null;
  return (
    <Button
      type='primary'
      icon={<Plus />}
      onClick={headerAdd}
      className='motion-safe:animate-[fade-up_160ms_ease-out_both]'
    >
      Add expense
    </Button>
  );
}
