import { CalendarRange, LogOut, Settings, UserRound } from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import { Avatar, Dropdown } from "antd";
import { useFlowApp } from "@/context";
import { cn } from "@/utils";
import { SECTIONS } from "../constants/routes";
import { useLogOut } from "../hooks/useLogOut";
import { useRosterPaths } from "../hooks/useRosterPaths";
import type { PendingInvite } from "../models/roster";
import { InviteBell } from "./InviteBell";

export function RosterHeader({
  invites,
  onJoined,
}: {
  invites: PendingInvite[];
  onJoined: (centerId: string) => void;
}) {
  const { app } = useFlowApp();
  const paths = useRosterPaths();

  return (
    <header className='sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-card px-2 sm:gap-4 sm:px-4'>
      <span className='hidden items-center gap-2 text-sm font-medium text-foreground sm:flex'>
        <CalendarRange className='size-4 text-brand-strong' />
        {app.name}
      </span>
      <nav aria-label='Roster' className='flex min-w-0 items-center gap-1'>
        {SECTIONS.map((s) => (
          <NavLink
            key={s.key}
            to={paths.section(s.key)}
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
      <div className='ms-auto flex items-center gap-1'>
        <InviteBell invites={invites} onJoined={onJoined} />
        <AccountMenu />
      </div>
    </header>
  );
}

function AccountMenu() {
  const { user } = useFlowApp();
  const navigate = useNavigate();
  const paths = useRosterPaths();
  const { logOut, holder } = useLogOut();

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
              label: "My settings",
              onClick: () => navigate(paths.settings),
            },
            {
              key: "log-out",
              icon: <LogOut />,
              label: "Log out",
              onClick: logOut,
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
