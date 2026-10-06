import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/libs";
import { ROSTER_KEYS } from "../constants/keys";
import type { MemberSessionType, SessionType } from "../models/roster";
import { check } from "../utils/errors";
import { refreshCenter } from "./branches";

export const sessionTypesQueryOptions = (centerId: string) =>
  queryOptions({
    queryKey: ROSTER_KEYS.sessionTypes(centerId),
    queryFn: async (): Promise<SessionType[]> =>
      check(
        await supabase
          .from("roster_session_types")
          .select("*")
          .eq("center_id", centerId)
          .order("name"),
      ),
  });

export const saveSessionTypeMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async ({
      id,
      ...values
    }: {
      id?: string;
      name: string;
      default_hourly_rate: number | null;
    }) => {
      check(
        id
          ? await supabase
              .from("roster_session_types")
              .update(values)
              .eq("id", id)
              .select("id")
              .single()
          : await supabase
              .from("roster_session_types")
              .insert({ ...values, center_id: centerId })
              .select("id")
              .single(),
      );
    },
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: (_data, vars) =>
        (vars as { id?: string }).id
          ? "Session type saved"
          : "Session type added",
      errorMessage: "Could not save session type",
    },
  });

export const deleteSessionTypeMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async (id: string) => {
      check(await supabase.from("roster_session_types").delete().eq("id", id));
    },
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: "Session type deleted",
      errorMessage: "Could not delete session type",
    },
  });

export const memberSessionTypesQueryOptions = (centerId: string) =>
  queryOptions({
    queryKey: ROSTER_KEYS.memberSessionTypes(centerId),
    queryFn: async (): Promise<MemberSessionType[]> =>
      check(
        await supabase
          .from("roster_member_session_types")
          .select("*")
          .eq("center_id", centerId),
      ),
  });

// Sets which session types a member teaches (none = all) without salaries;
// used for the owner, who isn't paid a salary.
export const setMemberSessionTypesMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async ({
      memberId,
      typeIds,
    }: {
      memberId: string;
      typeIds: string[];
    }) => {
      const current = check(
        await supabase
          .from("roster_member_session_types")
          .select("session_type_id")
          .eq("member_id", memberId),
      ).map((r) => r.session_type_id);
      const add = typeIds.filter((t) => !current.includes(t));
      const remove = current.filter((t) => !typeIds.includes(t));
      if (add.length)
        check(
          await supabase.from("roster_member_session_types").insert(
            add.map((typeId) => ({
              center_id: centerId,
              member_id: memberId,
              session_type_id: typeId,
            })),
          ),
        );
      if (remove.length)
        check(
          await supabase
            .from("roster_member_session_types")
            .delete()
            .eq("member_id", memberId)
            .in("session_type_id", remove),
        );
    },
    onSuccess: () => refreshCenter(centerId),
    meta: { successMessage: "Saved", errorMessage: "Could not save" },
  });
