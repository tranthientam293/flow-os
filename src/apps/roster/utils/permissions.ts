import type { Center, Session } from "../models/roster";
import { inCurrentMonth } from "./time";

export type SessionAccess = {
  canEdit: boolean;
  reason: string | null;
};

export function sessionAccess(
  session: Session,
  ctx: { center: Center; isOwner: boolean; meId: string },
): SessionAccess {
  if (!ctx.isOwner && session.member_id !== ctx.meId)
    return { canEdit: false, reason: null };
  if (!inCurrentMonth(ctx.center, session.starts_at))
    return {
      canEdit: false,
      reason: "Locked. Only sessions in the current month can be changed.",
    };
  return { canEdit: true, reason: null };
}
