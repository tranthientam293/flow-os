import { useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { sessionsQueryOptions } from "../apis/sessions";
import { useRoster } from "../context/roster-context";
import { addDays, dayStartIso } from "../utils/time";

export type SessionRange = { fromDate: string; days: number };

const rangeOptions = (centerId: string, tz: string, range: SessionRange) =>
  sessionsQueryOptions(
    centerId,
    dayStartIso(range.fromDate, tz),
    dayStartIso(addDays(range.fromDate, range.days), tz),
  );

export function useSessions(
  fromDate: string,
  days: number,
  {
    applyFilters = true,
    memberId,
    prefetchAdjacent = false,
    prefetch = [],
  }: {
    applyFilters?: boolean;
    memberId?: string;
    prefetchAdjacent?: boolean;
    prefetch?: SessionRange[];
  } = {},
) {
  const { center, filters, meId, isOwner } = useRoster();
  const tz = center.timezone;
  const queryClient = useQueryClient();
  const query = useQuery({
    ...rangeOptions(center.id, tz, { fromDate, days }),
    placeholderData: prefetchAdjacent ? keepPreviousData : undefined,
  });

  const [shown, setShown] = useState<SessionRange>({ fromDate, days });
  const settled = !!query.data && !query.isPlaceholderData;
  if (settled && (shown.fromDate !== fromDate || shown.days !== days))
    setShown({ fromDate, days });

  const prefetchKey = JSON.stringify([
    ...(prefetchAdjacent
      ? [
          { fromDate: addDays(fromDate, -days), days },
          { fromDate: addDays(fromDate, days), days },
        ]
      : []),
    ...prefetch,
  ]);
  useEffect(() => {
    const ranges = JSON.parse(prefetchKey) as SessionRange[];
    for (const range of ranges)
      void queryClient.prefetchQuery(rangeOptions(center.id, tz, range));
  }, [prefetchKey, queryClient, center.id, tz]);

  const sessions = useMemo(() => {
    const all = query.data ?? [];
    return all.filter((s) => {
      if (memberId && s.member_id !== memberId) return false;
      if (!applyFilters) return true;
      if (s.status === "cancelled" && !filters.showCancelled) return false;
      if (filters.branchIds.length && !filters.branchIds.includes(s.branch_id))
        return false;
      if (!isOwner) return true;
      if (filters.onlyMe && s.member_id !== meId) return false;
      if (filters.memberIds.length && !filters.memberIds.includes(s.member_id))
        return false;
      return true;
    });
  }, [query.data, filters, applyFilters, memberId, meId, isOwner]);

  return {
    sessions,
    all: query.data ?? [],
    isLoading: query.isLoading,
    shown: settled ? { fromDate, days } : shown,
    isSwitching: query.isPlaceholderData,
  };
}
