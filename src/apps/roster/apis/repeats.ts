import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/libs";
import { ROSTER_KEYS } from "../constants/keys";
import type { Repeat } from "../models/roster";
import { check } from "../utils/errors";
import { refreshCenter } from "./branches";

export type RepeatPayload = {
  memberId: string;
  branchId: string;
  sessionTypeId: string | null;
  // 0 = Sunday … 6 = Saturday.
  weekdays: number[];
  // HH:mm in the center's timezone.
  startsTime: string;
  endsTime: string;
  title: string | null;
  note: string | null;
  // YYYY-MM-DD, today or later.
  startsOn: string;
  traineeCount: number;
};

// Sets up a weekly repeat (roster_start_repeat). It books up to the end of
// this week (of next week on the week's last day) right away, and a job adds
// each following week on the week's last day. Returns how many sessions were
// booked now.
export const startRepeatMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async (p: RepeatPayload): Promise<number> =>
      check(
        await supabase.rpc("roster_start_repeat", {
          p_center_id: centerId,
          p_member_id: p.memberId,
          p_branch_id: p.branchId,
          p_session_type_id: p.sessionTypeId,
          p_weekdays: p.weekdays,
          p_starts_time: p.startsTime,
          p_ends_time: p.endsTime,
          p_title: p.title,
          p_note: p.note,
          p_starts_on: p.startsOn,
          p_trainee_count: p.traineeCount,
        }),
      ),
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: (count) =>
        count === 1
          ? "Repeat set up · 1 session booked"
          : `Repeat set up · ${count as number} sessions booked`,
      errorMessage: "Could not set up the repeat",
    },
  });

export const repeatQueryOptions = (centerId: string, repeatId: string) =>
  queryOptions({
    queryKey: ROSTER_KEYS.repeat(centerId, repeatId),
    queryFn: async (): Promise<Repeat | null> =>
      check(
        await supabase
          .from("roster_repeats")
          .select("*")
          .eq("id", repeatId)
          .maybeSingle(),
      ),
  });

// A center's active repeats, oldest first. RLS returns every trainer's to the
// owner and only your own to a trainer.
export const repeatsQueryOptions = (centerId: string) =>
  queryOptions({
    queryKey: ROSTER_KEYS.repeats(centerId),
    queryFn: async (): Promise<Repeat[]> =>
      check(
        await supabase
          .from("roster_repeats")
          .select("*")
          .eq("center_id", centerId)
          .is("stopped_at", null)
          .order("created_at"),
      ),
  });

export type RepeatUpdate = Omit<RepeatPayload, "memberId" | "startsOn"> & {
  repeatId: string;
};

// Edits a repeat from now on: its upcoming sessions nobody changed are
// rebooked with the new settings; past ones and ones edited by hand stay.
export const updateRepeatMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async (p: RepeatUpdate): Promise<number> =>
      check(
        await supabase.rpc("roster_update_repeat", {
          p_repeat_id: p.repeatId,
          p_branch_id: p.branchId,
          p_session_type_id: p.sessionTypeId,
          p_weekdays: p.weekdays,
          p_starts_time: p.startsTime,
          p_ends_time: p.endsTime,
          p_title: p.title,
          p_note: p.note,
          p_trainee_count: p.traineeCount,
        }),
      ),
    onSuccess: () => refreshCenter(centerId),
    meta: { successMessage: "Repeat updated", errorMessage: "Could not save" },
  });

// Stops a repeat from now on: no new weeks, and its upcoming sessions nobody
// changed are removed. Past ones and ones edited by hand stay.
export const stopRepeatMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async (repeatId: string): Promise<number> =>
      check(
        await supabase.rpc("roster_stop_repeat", { p_repeat_id: repeatId }),
      ),
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: "Repeat stopped",
      errorMessage: "Could not stop the repeat",
    },
  });
