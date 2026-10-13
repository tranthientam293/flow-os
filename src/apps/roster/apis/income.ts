import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/libs";
import { ROSTER_KEYS } from "../constants/keys";
import type { Session, SessionFee } from "../models/roster";
import { check } from "../utils/errors";

export type CenterIncome = { sessions: Session[]; fees: SessionFee[] };

// A trainer's completed sessions in [from, to) that have started, with their
// fees. Lives under the center key, so completing or restoring a session
// refreshes it.
export const incomeQueryOptions = (
  centerId: string,
  memberId: string,
  from: string,
  to: string,
) =>
  queryOptions({
    queryKey: ROSTER_KEYS.income(centerId, memberId, from, to),
    queryFn: async (): Promise<CenterIncome> => {
      const now = new Date().toISOString();
      const sessions = check(
        await supabase
          .from("roster_sessions")
          .select("*")
          .eq("center_id", centerId)
          .eq("member_id", memberId)
          .eq("status", "completed")
          .gte("starts_at", from)
          .lt("starts_at", to < now ? to : now)
          .order("starts_at"),
      );
      const fees = sessions.length
        ? check(
            await supabase
              .from("roster_session_fees")
              .select("*")
              .in(
                "session_id",
                sessions.map((s) => s.id),
              )
              .order("created_at"),
          )
        : [];
      return { sessions, fees };
    },
  });
