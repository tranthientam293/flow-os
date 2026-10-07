import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient, supabase } from "@/libs";
import { ROSTER_KEYS } from "../constants/keys";
import type { Member, MemberStatus } from "../models/roster";
import { check } from "../utils/errors";
import { refreshCenter } from "./branches";

export const membersQueryOptions = (centerId: string) =>
  queryOptions({
    queryKey: ROSTER_KEYS.members(centerId),
    queryFn: async (): Promise<Member[]> =>
      check(
        await supabase
          .from("roster_members")
          .select("*")
          .eq("center_id", centerId)
          .order("role", { ascending: false })
          .order("display_name"),
      ),
  });

export const memberQueryOptions = (centerId: string, memberId: string) =>
  queryOptions({
    queryKey: [...ROSTER_KEYS.members(centerId), memberId] as const,
    queryFn: async (): Promise<Member> =>
      check(
        await supabase
          .from("roster_members")
          .select("*")
          .eq("id", memberId)
          .single(),
      ),
  });

export type TrainerPayload = {
  id?: string;
  display_name: string;
  email: string;
  phone: string | null;
  color: string;
  any_branch: boolean;
  branchIds: string[];
  // Session types the trainer teaches with their salary per hour (null = the
  // type's default). Empty means every session type at its default salary.
  sessions: { sessionTypeId: string; hourlyRate: number | null }[];
};

export const saveTrainerMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async ({
      id,
      branchIds,
      sessions,
      ...values
    }: TrainerPayload): Promise<Member> => {
      const member: Member = id
        ? check(
            await supabase
              .from("roster_members")
              .update(values)
              .eq("id", id)
              .select()
              .single(),
          )
        : check(
            await supabase
              .from("roster_members")
              .insert({ ...values, center_id: centerId })
              .select()
              .single(),
          );

      const current = new Set(
        check(
          await supabase
            .from("roster_member_branches")
            .select("branch_id")
            .eq("member_id", member.id),
        ).map((r) => r.branch_id),
      );
      const add = branchIds.filter((b) => !current.has(b));
      const remove = [...current].filter((b) => !branchIds.includes(b));
      if (add.length)
        check(
          await supabase.from("roster_member_branches").insert(
            add.map((branchId) => ({
              center_id: centerId,
              member_id: member.id,
              branch_id: branchId,
            })),
          ),
        );
      if (remove.length)
        check(
          await supabase
            .from("roster_member_branches")
            .delete()
            .eq("member_id", member.id)
            .in("branch_id", remove),
        );

      const currentTypes = new Map(
        check(
          await supabase
            .from("roster_member_session_types")
            .select("session_type_id, hourly_rate")
            .eq("member_id", member.id),
        ).map((r) => [r.session_type_id, r.hourly_rate]),
      );
      const addTypes = sessions.filter(
        (s) => !currentTypes.has(s.sessionTypeId),
      );
      const changed = sessions.filter(
        (s) =>
          currentTypes.has(s.sessionTypeId) &&
          currentTypes.get(s.sessionTypeId) !== s.hourlyRate,
      );
      const removeTypes = [...currentTypes.keys()].filter(
        (t) => !sessions.some((s) => s.sessionTypeId === t),
      );
      if (addTypes.length)
        check(
          await supabase.from("roster_member_session_types").insert(
            addTypes.map((s) => ({
              center_id: centerId,
              member_id: member.id,
              session_type_id: s.sessionTypeId,
              hourly_rate: s.hourlyRate,
            })),
          ),
        );
      for (const s of changed)
        check(
          await supabase
            .from("roster_member_session_types")
            .update({ hourly_rate: s.hourlyRate })
            .eq("member_id", member.id)
            .eq("session_type_id", s.sessionTypeId),
        );
      if (removeTypes.length)
        check(
          await supabase
            .from("roster_member_session_types")
            .delete()
            .eq("member_id", member.id)
            .in("session_type_id", removeTypes),
        );

      return member;
    },
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: (_data, vars) =>
        (vars as TrainerPayload).id ? "Saved" : "Invite created",
      errorMessage: "Could not save",
    },
  });

export const setMemberStatusMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: MemberStatus;
    }) => {
      check(
        await supabase.from("roster_members").update({ status }).eq("id", id),
      );
    },
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: (_data, vars) =>
        (vars as { status: MemberStatus }).status === "inactive"
          ? "Deactivated"
          : "Reactivated",
      errorMessage: "Could not update",
    },
  });

export const removeMemberMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async (id: string) => {
      check(await supabase.from("roster_members").delete().eq("id", id));
    },
    onSuccess: () => refreshCenter(centerId),
    meta: { successMessage: "Removed", errorMessage: "Could not remove" },
  });

// The color isn't editable: it was picked automatically when the member was added.
export type MyProfile = {
  display_name: string;
  phone: string | null;
};

export const updateMyProfileMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async (profile: MyProfile & { color: string }) => {
      check(
        await supabase.rpc("roster_update_my_profile", {
          p_center_id: centerId,
          p_display_name: profile.display_name,
          p_phone: profile.phone ?? "",
          p_color: profile.color,
        }),
      );
    },
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: "Profile saved",
      errorMessage: "Could not save profile",
    },
  });

export const setAlsoTrainerMutationOptions = () =>
  mutationOptions({
    mutationFn: async ({
      memberId,
      alsoTrainer,
    }: {
      memberId: string;
      alsoTrainer: boolean;
    }) => {
      check(
        await supabase
          .from("roster_members")
          .update({ also_trainer: alsoTrainer })
          .eq("id", memberId)
          .select("id")
          .single(),
      );
    },
    // Memberships carry the flag too (it decides the My schedule section).
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ROSTER_KEYS.all }),
    meta: {
      successMessage: (_data, vars) =>
        (vars as { alsoTrainer: boolean }).alsoTrainer
          ? "You’re in the trainer list"
          : "You’re no longer in the trainer list",
      errorMessage: "Could not update",
    },
  });
