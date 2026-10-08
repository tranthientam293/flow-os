import { useState } from "react";
import { useNavigate } from "react-router";
import { useQueries } from "@tanstack/react-query";
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
import type { RosterSection } from "../constants/routes";
import {
  DEFAULT_FILTERS,
  buildRosterContext,
  type BookingRequest,
  type RosterContextValue,
  type ScheduleFilters,
} from "../context/roster-context";
import type { Membership } from "../models/roster";
import { useRosterPaths } from "./useRosterPaths";

// One RosterContext per center, so views that span several centers can render
// each session (details, edit, permissions) in its own center's context.
export function useCenterContexts(
  section: RosterSection,
  memberships: Membership[],
  openBooking: (centerId: string, request: BookingRequest) => void,
) {
  const navigate = useNavigate();
  const paths = useRosterPaths();
  const [filters, setFilters] = useState<ScheduleFilters>(DEFAULT_FILTERS);
  const ids = memberships.map((m) => m.center.id);
  const directories = useQueries({
    queries: ids.map((id) => directoryQueryOptions(id)),
  });
  const branches = useQueries({
    queries: ids.map((id) => branchesQueryOptions(id)),
  });
  const memberBranches = useQueries({
    queries: ids.map((id) => memberBranchesQueryOptions(id)),
  });
  const sessionTypes = useQueries({
    queries: ids.map((id) => sessionTypesQueryOptions(id)),
  });
  const memberSessionTypes = useQueries({
    queries: ids.map((id) => memberSessionTypesQueryOptions(id)),
  });
  const members = useQueries({
    queries: memberships.map((m) => ({
      ...membersQueryOptions(m.center.id),
      enabled: m.role === "owner",
    })),
  });

  const contexts = new Map<string, RosterContextValue>(
    memberships.map((membership, i) => [
      membership.center.id,
      buildRosterContext({
        membership,
        directory: directories[i]?.data,
        branches: branches[i]?.data,
        memberBranches: memberBranches[i]?.data,
        sessionTypes: sessionTypes[i]?.data,
        memberSessionTypes: memberSessionTypes[i]?.data,
        members: members[i]?.data,
        filters,
        setFilters,
        goTo: (tab) =>
          navigate(paths.center(section, membership.center.id, tab)),
        openBooking: (request = {}) =>
          openBooking(membership.center.id, request),
      }),
    ]),
  );

  return {
    contexts,
    isLoading: [...directories, ...branches].some((q) => q.isLoading),
  };
}
