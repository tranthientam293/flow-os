import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient, supabase } from "@/libs";
import { ROSTER_KEYS } from "../constants/keys";
import type {
  Branch,
  BranchInsert,
  BranchUpdate,
  MemberBranch,
} from "../models/roster";
import { check } from "../utils/errors";

export const refreshCenter = (centerId: string) =>
  queryClient.invalidateQueries({ queryKey: ROSTER_KEYS.center(centerId) });

export const branchesQueryOptions = (centerId: string) =>
  queryOptions({
    queryKey: ROSTER_KEYS.branches(centerId),
    queryFn: async (): Promise<Branch[]> =>
      check(
        await supabase
          .from("roster_branches")
          .select("*")
          .eq("center_id", centerId)
          .order("code"),
      ),
  });

export const memberBranchesQueryOptions = (centerId: string) =>
  queryOptions({
    queryKey: ROSTER_KEYS.memberBranches(centerId),
    queryFn: async (): Promise<MemberBranch[]> =>
      check(
        await supabase
          .from("roster_member_branches")
          .select("*")
          .eq("center_id", centerId),
      ),
  });

export const saveBranchMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async ({
      id,
      ...values
    }: Omit<BranchInsert, "center_id"> & { id?: string }): Promise<Branch> =>
      id
        ? check(
            await supabase
              .from("roster_branches")
              .update(values)
              .eq("id", id)
              .select()
              .single(),
          )
        : check(
            await supabase
              .from("roster_branches")
              .insert({ ...values, center_id: centerId })
              .select()
              .single(),
          ),
    onSuccess: () => refreshCenter(centerId),
    meta: { successMessage: "Saved", errorMessage: "Could not save" },
  });

export const archiveBranchMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const changes: BranchUpdate = {
        archived_at: archived ? new Date().toISOString() : null,
      };
      check(
        await supabase.from("roster_branches").update(changes).eq("id", id),
      );
    },
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: (_data, vars) =>
        (vars as { archived: boolean }).archived ? "Archived" : "Restored",
      errorMessage: "Could not update",
    },
  });

export type AssignmentChange = {
  add: { memberId: string; refId: string }[];
  remove: { memberId: string; refId: string }[];
};

export const assignBranchesMutationOptions = (centerId: string) =>
  mutationOptions({
    mutationFn: async ({ add, remove }: AssignmentChange) => {
      if (add.length)
        check(
          await supabase.from("roster_member_branches").insert(
            add.map(({ memberId, refId }) => ({
              center_id: centerId,
              member_id: memberId,
              branch_id: refId,
            })),
          ),
        );
      for (const { memberId, refId } of remove)
        check(
          await supabase
            .from("roster_member_branches")
            .delete()
            .eq("member_id", memberId)
            .eq("branch_id", refId),
        );
    },
    onSuccess: () => refreshCenter(centerId),
    meta: {
      successMessage: "Assignments saved",
      errorMessage: "Could not save assignments",
    },
  });
