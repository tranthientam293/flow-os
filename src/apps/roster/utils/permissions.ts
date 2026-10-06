import type { Center, Session } from "../models/roster";
import { trainerCanEdit } from "./time";

export type SessionAccess = {
  canEdit: boolean;
  reason: string | null;
};

export function sessionAccess(
  session: Session,
  ctx: { center: Center; isOwner: boolean; meId: string },
): SessionAccess {
  if (ctx.isOwner) return { canEdit: true, reason: null };
  if (session.member_id !== ctx.meId) return { canEdit: false, reason: null };
  if (!trainerCanEdit(ctx.center, session.starts_at))
    return {
      canEdit: false,
      reason:
        new Date(session.starts_at) > new Date()
          ? "Only the owner can change sessions this far ahead."
          : "Locked. Only the owner can change this session.",
    };
  return { canEdit: true, reason: null };
}
