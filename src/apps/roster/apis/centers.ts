import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient, supabase } from "@/libs";
import { ROSTER_KEYS } from "../constants/keys";
import type {
  CenterUpdate,
  CreateCenterPayload,
  DirectoryMember,
  Membership,
  PendingInvite,
} from "../models/roster";
import { check } from "../utils/errors";

export const membershipsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ROSTER_KEYS.memberships(userId),
    queryFn: async (): Promise<Membership[]> => {
      const data = check(
        await supabase
          .from("roster_members")
          .select(
            "id, role, status, any_branch, also_trainer, center:roster_centers!inner(*)",
          )
          .eq("user_id", userId)
          .eq("status", "active"),
      );
      return data.sort((a, b) => a.center.name.localeCompare(b.center.name));
    },
  });

export const pendingInvitesQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ROSTER_KEYS.invites(userId),
    queryFn: async (): Promise<PendingInvite[]> =>
      check(await supabase.rpc("roster_pending_invites")),
  });

export const directoryQueryOptions = (centerId: string) =>
  queryOptions({
    queryKey: ROSTER_KEYS.directory(centerId),
    queryFn: async (): Promise<DirectoryMember[]> =>
      check(
        await supabase.rpc("roster_member_directory", {
          p_center_id: centerId,
        }),
      ),
  });

const refreshMemberships = () =>
  queryClient.invalidateQueries({ queryKey: ROSTER_KEYS.all });

export const createCenterMutationOptions = () =>
  mutationOptions({
    mutationFn: async (payload: CreateCenterPayload): Promise<string> =>
      check(
        await supabase.rpc("roster_create_center", {
          p_name: payload.name,
          p_timezone: payload.timezone,
          p_display_name: payload.displayName,
          p_color: payload.color,
        }),
      ),
    onSuccess: refreshMemberships,
    meta: {
      successMessage: (_data, payload) =>
        `${(payload as CreateCenterPayload).name} is ready`,
      errorMessage: "Could not register",
    },
  });

export const claimInviteMutationOptions = () =>
  mutationOptions({
    mutationFn: async (memberId: string): Promise<string> =>
      check(
        await supabase.rpc("roster_claim_invite", { p_member_id: memberId }),
      ),
    onSuccess: refreshMemberships,
    meta: { successMessage: "You joined", errorMessage: "Could not join" },
  });

export const leaveCenterMutationOptions = () =>
  mutationOptions({
    mutationFn: async (centerId: string) => {
      check(
        await supabase.rpc("roster_leave_center", { p_center_id: centerId }),
      );
    },
    onSuccess: refreshMemberships,
    meta: { successMessage: "You left", errorMessage: "Could not leave" },
  });

export const updateCenterMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async (changes: CenterUpdate) => {
      check(
        await supabase
          .from("roster_centers")
          .update(changes)
          .eq("id", centerId)
          .select("id")
          .single(),
      );
    },
    onSuccess: refreshMemberships,
    meta: {
      successMessage: "Settings saved",
      errorMessage: "Could not save settings",
    },
  });

export const deleteCenterMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async () => {
      check(await supabase.from("roster_centers").delete().eq("id", centerId));
    },
    onSuccess: refreshMemberships,
    meta: { successMessage: "Deleted", errorMessage: "Could not delete" },
  });
