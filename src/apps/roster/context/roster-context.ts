import { createContext, useContext } from "react";
import type { RosterTab } from "../constants/routes";
import type {
  Branch,
  Center,
  DirectoryMember,
  Member,
  MemberBranch,
  MemberSessionType,
  Membership,
  Session,
  SessionType,
} from "../models/roster";

export type ScheduleFilters = {
  branchIds: string[];
  memberIds: string[];
  onlyMe: boolean;
  showCancelled: boolean;
};

export type BookingRequest = {
  nonce?: number;
  session?: Session;
  branchId?: string;
  date?: string;
  start?: string;
  memberId?: string;
};

export type RosterContextValue = {
  center: Center;
  membership: Membership;
  meId: string;
  isOwner: boolean;
  directory: DirectoryMember[];
  memberById: Map<string, DirectoryMember>;
  branches: Branch[];
  branchById: Map<string, Branch>;
  sessionTypes: SessionType[];
  typeById: Map<string, SessionType>;
  memberSessionTypes: MemberSessionType[];
  memberBranches: MemberBranch[];
  anyBranchIds: Set<string>;
  filters: ScheduleFilters;
  setFilters: (next: ScheduleFilters) => void;
  goTo: (tab: RosterTab) => void;
  openBooking: (request?: BookingRequest) => void;
};

export const RosterContext = createContext<RosterContextValue | null>(null);

export function useRoster(): RosterContextValue {
  const ctx = useContext(RosterContext);
  if (!ctx) throw new Error("useRoster must be used inside a Roster center");
  return ctx;
}

export const DEFAULT_FILTERS: ScheduleFilters = {
  branchIds: [],
  memberIds: [],
  onlyMe: false,
  showCancelled: false,
};

const byId = <T extends { id: string }>(items: readonly T[]) =>
  new Map(items.map((item) => [item.id, item]));

export function buildRosterContext({
  membership,
  directory = [],
  branches = [],
  memberBranches = [],
  sessionTypes = [],
  memberSessionTypes = [],
  members = [],
  filters,
  setFilters,
  goTo,
  openBooking,
}: {
  membership: Membership;
  directory?: DirectoryMember[];
  branches?: Branch[];
  memberBranches?: MemberBranch[];
  sessionTypes?: SessionType[];
  memberSessionTypes?: MemberSessionType[];
  members?: Pick<Member, "id" | "any_branch">[];
  filters: Partial<ScheduleFilters>;
  setFilters: (next: ScheduleFilters) => void;
  goTo: (tab: RosterTab) => void;
  openBooking: (request?: BookingRequest) => void;
}): RosterContextValue {
  const isOwner = membership.role === "owner";
  return {
    center: membership.center,
    membership,
    meId: membership.id,
    isOwner,
    directory,
    memberById: byId(directory),
    branches,
    branchById: byId(branches),
    sessionTypes,
    typeById: byId(sessionTypes),
    memberSessionTypes,
    memberBranches,
    anyBranchIds: new Set(
      isOwner
        ? members.filter((m) => m.any_branch).map((m) => m.id)
        : membership.any_branch
          ? [membership.id]
          : [],
    ),
    filters: { ...DEFAULT_FILTERS, ...filters },
    setFilters,
    goTo,
    openBooking,
  };
}
