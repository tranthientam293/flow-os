import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/libs";
import { ROSTER_KEYS } from "../constants/keys";
import type { Session, SessionInsert, SessionStatus } from "../models/roster";
import { check } from "../utils/errors";
import { refreshCenter } from "./branches";

export const sessionsQueryOptions = (
  centerId: string,
  from: string,
  to: string,
) =>
  queryOptions({
    queryKey: ROSTER_KEYS.sessions(centerId, from, to),
    queryFn: async (): Promise<Session[]> =>
      check(
        await supabase
          .from("roster_sessions")
          .select("*")
          .eq("center_id", centerId)
          .lt("starts_at", to)
          .gt("ends_at", from)
          .order("starts_at"),
      ),
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
          : "Session updated",
      errorMessage: "Could not update session",
    },
  });
