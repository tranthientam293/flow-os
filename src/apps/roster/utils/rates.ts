import type {
  MemberSessionType,
  SessionType,
  TrainerRate,
} from "../models/roster";

// The salary per hour the owner set for a trainer and session type: that
// trainer's rate, else the type's default. A reference for the trainer.
export function ownerRateFor(
  memberSessionTypes: MemberSessionType[],
  typeById: Map<string, SessionType>,
  memberId: string,
  typeId: string | null,
): number | null {
  if (!typeId) return null;
  return (
    memberSessionTypes.find(
      (mst) => mst.member_id === memberId && mst.session_type_id === typeId,
    )?.hourly_rate ??
    typeById.get(typeId)?.default_hourly_rate ??
    null
  );
}

// The trainer's own salary per hour for a session type, if they set one.
export function trainerOwnRateFor(
  trainerRates: TrainerRate[],
  memberId: string,
  typeId: string | null,
): number | null {
  if (!typeId) return null;
  return (
    trainerRates.find(
      (r) => r.member_id === memberId && r.session_type_id === typeId,
    )?.hourly_rate ?? null
  );
}
