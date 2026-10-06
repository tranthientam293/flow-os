import type { Database, Tables, TablesInsert, TablesUpdate } from "@/models";

type Functions = Database["public"]["Functions"];

export type Role = "owner" | "trainer";
export type MemberStatus = "invited" | "active" | "inactive";
export type SessionStatus = "scheduled" | "completed" | "missed" | "cancelled";

export type Center = Tables<"roster_centers">;
export type CenterUpdate = TablesUpdate<"roster_centers">;

export type Member = Tables<"roster_members">;
export type MemberInsert = TablesInsert<"roster_members">;
export type MemberUpdate = TablesUpdate<"roster_members">;

export type Membership = Pick<
  Member,
  "id" | "role" | "status" | "any_branch" | "also_trainer"
> & {
  center: Center;
};

export type DirectoryMember =
  Functions["roster_member_directory"]["Returns"][number];

export type Branch = Tables<"roster_branches">;
export type BranchInsert = TablesInsert<"roster_branches">;
export type BranchUpdate = TablesUpdate<"roster_branches">;

export type MemberBranch = Tables<"roster_member_branches">;

export type SessionType = Tables<"roster_session_types">;
export type MemberSessionType = Tables<"roster_member_session_types">;

export type Session = Tables<"roster_sessions">;
export type SessionInsert = TablesInsert<"roster_sessions">;
export type SessionUpdate = TablesUpdate<"roster_sessions">;

export type PendingInvite =
  Functions["roster_pending_invites"]["Returns"][number];

export type CreateCenterPayload = {
  name: string;
  timezone: string;
  displayName: string;
  color: string;
};
