import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/libs";
import { ROSTER_KEYS } from "../constants/keys";
import type {
  Session,
  SessionEvent,
  SessionFee,
  SessionInsert,
  SessionStatus,
} from "../models/roster";
import { check } from "../utils/errors";
import { refreshCenter } from "./branches";

// Pass `memberId` to load only that member's sessions.
export const sessionsQueryOptions = (
  centerId: string,
  from: string,
  to: string,
  memberId?: string,
) =>
  queryOptions({
    queryKey: ROSTER_KEYS.sessions(centerId, from, to, memberId),
    queryFn: async (): Promise<Session[]> => {
      let query = supabase
        .from("roster_sessions")
        .select("*")
        .eq("center_id", centerId)
        .is("deleted_at", null)
        .lt("starts_at", to)
        .gt("ends_at", from);
      if (memberId) query = query.eq("member_id", memberId);
      return check(await query.order("starts_at"));
    },
  });

export type SessionPayload = Omit<SessionInsert, "center_id"> & { id?: string };

export const saveSessionMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async ({ id, ...values }: SessionPayload): Promise<Session> =>
      id
        ? check(
            await supabase
              .from("roster_sessions")
              .update(values)
              .eq("id", id)
              .select()
              .single(),
          )
        : check(
            await supabase
              .from("roster_sessions")
              .insert({ ...values, center_id: centerId })
              .select()
              .single(),
          ),
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: (_data, vars) =>
        (vars as SessionPayload).id ? "Session saved" : "Session booked",
      errorMessage: "Could not save session",
    },
  });

// Who did what to a session, newest first (recorded by a database trigger).
export const sessionEventsQueryOptions = (
  centerId: string,
  sessionId: string,
) =>
  queryOptions({
    queryKey: ROSTER_KEYS.sessionEvents(centerId, sessionId),
    queryFn: async (): Promise<SessionEvent[]> =>
      check(
        await supabase
          .from("roster_session_events")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(50),
      ),
  });

export const sessionFeesQueryOptions = (centerId: string, sessionId: string) =>
  queryOptions({
    queryKey: ROSTER_KEYS.sessionFees(centerId, sessionId),
    queryFn: async (): Promise<SessionFee[]> =>
      check(
        await supabase
          .from("roster_session_fees")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at"),
      ),
  });

export type CheckoutPayload = {
  sessionId: string;
  // The trainer's salary (ignored when the owner checks out); null keeps a
  // saved one, or uses base salary × hours or × trainees.
  salary: number | null;
  fees: { label: string; amount: number }[];
};

// Completes a session and records its pay (roster_checkout_session).
export const checkoutSessionMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async ({ sessionId, salary, fees }: CheckoutPayload) => {
      check(
        await supabase.rpc("roster_checkout_session", {
          p_session_id: sessionId,
          p_salary: salary,
          p_fees: fees,
        }),
      );
    },
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: "Session completed",
      errorMessage: "Could not complete session",
    },
  });

export const reopenSessionMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async (sessionId: string) => {
      check(
        await supabase.rpc("roster_reopen_session", {
          p_session_id: sessionId,
        }),
      );
    },
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: "Completion undone",
      errorMessage: "Could not undo completion",
    },
  });

export const setSessionStatusMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: SessionStatus;
    }) => {
      check(
        await supabase
          .from("roster_sessions")
          .update({ status })
          .eq("id", id)
          .select("id")
          .single(),
      );
    },
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: (_data, vars) =>
        (vars as { status: SessionStatus }).status === "cancelled"
          ? "Session cancelled"
          : (vars as { status: SessionStatus }).status === "scheduled"
            ? "Session restored"
            : "Session updated",
      errorMessage: "Could not update session",
    },
  });

// Deletes one session (roster_delete_session): a soft delete, so its trainer
// can restore it from the Deleted tab. A repeat keeps running without that day.
export const deleteSessionMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async (sessionId: string) => {
      check(
        await supabase.rpc("roster_delete_session", {
          p_session_id: sessionId,
        }),
      );
    },
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: "Session deleted",
      errorMessage: "Could not delete session",
    },
  });

// One trainer's deleted sessions at a center, most recently deleted first.
export const deletedSessionsQueryOptions = (
  centerId: string,
  memberId: string,
) =>
  queryOptions({
    queryKey: ROSTER_KEYS.deletedSessions(centerId, memberId),
    queryFn: async (): Promise<Session[]> =>
      check(
        await supabase
          .from("roster_sessions")
          .select("*")
          .eq("center_id", centerId)
          .eq("member_id", memberId)
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false }),
      ),
  });

// Brings a deleted session back (roster_restore_session).
export const restoreSessionMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async (sessionId: string) => {
      check(
        await supabase.rpc("roster_restore_session", {
          p_session_id: sessionId,
        }),
      );
    },
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: "Session restored",
      errorMessage: "Could not restore session",
    },
  });
