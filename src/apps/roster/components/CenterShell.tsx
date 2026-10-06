import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { Button } from "antd";
import { useQuery } from "@tanstack/react-query";
import { CenteredSpinner } from "@/components/atoms";
import { useAppStorage } from "@/hooks";
import { cn } from "@/utils";
import {
  branchesQueryOptions,
  memberBranchesQueryOptions,
} from "../apis/branches";
import { directoryQueryOptions } from "../apis/centers";
import { membersQueryOptions } from "../apis/members";
import {
  memberSessionTypesQueryOptions,
  sessionTypesQueryOptions,
} from "../apis/session-types";
import { STORAGE_KEYS } from "../constants/keys";
import {
  sectionOf,
  type RosterSection,
  type RosterTab,
} from "../constants/routes";
import {
  DEFAULT_FILTERS,
  RosterContext,
  buildRosterContext,
  type BookingRequest,
  type RosterContextValue,
  type ScheduleFilters,
} from "../context/roster-context";
import { useRosterPaths } from "../hooks/useRosterPaths";
import type { Membership } from "../models/roster";
import { BranchesView } from "./BranchesView";
import { MyWeekView } from "./MyWeekView";
import { ScheduleView } from "./ScheduleView";
import { SessionDrawer } from "./SessionDrawer";
import { SessionTypesView } from "./SessionTypesView";
import { SettingsView } from "./SettingsView";
import { TrainersView } from "./TrainersView";

export function CenterShell({
  section,
  tab,
  membership,
}: {
  section: RosterSection;
  tab: RosterTab;
  membership: Membership;
}) {
  const { center } = membership;
  const isOwner = membership.role === "owner";
  const navigate = useNavigate();
  const paths = useRosterPaths();

  const directory = useQuery(directoryQueryOptions(center.id));
  const branches = useQuery(branchesQueryOptions(center.id));
  const memberBranches = useQuery(memberBranchesQueryOptions(center.id));
  const sessionTypes = useQuery(sessionTypesQueryOptions(center.id));
  const memberSessionTypes = useQuery(
    memberSessionTypesQueryOptions(center.id),
  );
  const members = useQuery({
    ...membersQueryOptions(center.id),
    enabled: isOwner,
  });

  const [storedFilters, setStoredFilters] = useAppStorage<ScheduleFilters>(
    STORAGE_KEYS.scheduleFilters,
    DEFAULT_FILTERS,
  );
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const goTo = useCallback(
    (next: RosterTab) => navigate(paths.center(section, center.id, next)),
    [navigate, paths, section, center.id],
  );

  const openBooking = useCallback(
    (request: BookingRequest = {}) =>
      setBooking({ ...request, nonce: Date.now() }),
    [],
  );

  const value = useMemo<RosterContextValue>(
    () =>
      buildRosterContext({
        membership,
        directory: directory.data,
        branches: branches.data,
        memberBranches: memberBranches.data,
        sessionTypes: sessionTypes.data,
        memberSessionTypes: memberSessionTypes.data,
        members: members.data,
        // My schedule only shows your own sessions, also for owners who train.
        filters:
          section === "work"
            ? { ...storedFilters, onlyMe: true, memberIds: [] }
            : storedFilters,
        setFilters: setStoredFilters,
        goTo,
        openBooking,
      }),
    [
      membership,
      directory.data,
      branches.data,
      memberBranches.data,
      sessionTypes.data,
      memberSessionTypes.data,
      members.data,
      section,
      storedFilters,
      setStoredFilters,
      goTo,
      openBooking,
    ],
  );

  const tabs = sectionOf(section).tabs;

  return (
    <RosterContext.Provider value={value}>
      <div className='flex min-h-0 flex-1 flex-col'>
        <div className='flex h-11 shrink-0 items-stretch gap-3 overflow-hidden border-b px-2 sm:px-4'>
          <span className='hidden max-w-48 shrink-0 items-center truncate text-sm font-medium text-foreground sm:flex'>
            {center.name}
          </span>
          <nav
            aria-label={`${center.name} sections`}
            className='flex min-w-0 flex-1 [scrollbar-width:none] items-stretch gap-1 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden'
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                type='button'
                aria-current={tab === t.key ? "page" : undefined}
                onClick={() => goTo(t.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 px-3 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                  tab === t.key &&
                    "text-foreground shadow-[inset_0_-2px_0_var(--foreground)]",
                )}
              >
                <t.icon className='size-4 shrink-0' strokeWidth={1.75} />
                {t.label}
              </button>
            ))}
          </nav>
          {tab === "schedule" && (
            <div className='hidden shrink-0 items-center sm:flex'>
              <Button
                type='primary'
                size='small'
                icon={<Plus />}
                onClick={() => value.openBooking()}
              >
                Book session
              </Button>
            </div>
          )}
        </div>
        <div className='min-h-0 flex-1'>
          {directory.isLoading || branches.isLoading ? (
            <CenteredSpinner />
          ) : (
            <>
              {tab === "schedule" && <ScheduleView />}
              {tab === "week" && <MyWeekView />}
              {tab === "trainers" && <TrainersView />}
              {tab === "branches" && <BranchesView />}
              {tab === "types" && <SessionTypesView />}
              {tab === "settings" && <SettingsView />}
            </>
          )}
        </div>
      </div>
      {tab === "schedule" && (
        <Button
          type='primary'
          shape='circle'
          size='large'
          icon={<Plus />}
          aria-label='Book session'
          onClick={() => value.openBooking()}
          className='fixed right-4 bottom-6 z-20 shadow-lg sm:hidden'
        />
      )}
      <SessionDrawer request={booking} onClose={() => setBooking(null)} />
    </RosterContext.Provider>
  );
}
