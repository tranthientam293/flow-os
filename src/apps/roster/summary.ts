import type { SupabaseClient } from "@/libs";
import { STORAGE_KEYS } from "./constants/keys";
import { addDays, dayStartIso, todayIn } from "./utils/time";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export async function getSummary({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<string | null> {
  const [{ data: memberships }, { data: stored }, { data: invites }] =
    await Promise.all([
      supabase
        .from("roster_members")
        .select("id, center:roster_centers!inner(id, name, timezone)")
        .eq("user_id", userId)
        .eq("status", "active"),
      supabase
        .from("app_storage")
        .select("value")
        .eq("app_id", "roster")
        .eq("key", STORAGE_KEYS.activeCenterId)
        .maybeSingle(),
      supabase.rpc("roster_pending_invites"),
    ]);
  const inviteText = invites?.length
    ? plural(invites.length, "invitation")
    : null;
  if (!memberships?.length) return inviteText;

  const membership =
    memberships.find((m) => m.center.id === stored?.value) ?? memberships[0];
  const { center } = membership;
  const today = todayIn(center.timezone);

  const { count } = await supabase
    .from("roster_sessions")
    .select("id", { count: "exact", head: true })
    .eq("member_id", membership.id)
    .in("status", ["scheduled", "completed"])
    .gte("starts_at", dayStartIso(today, center.timezone))
    .lt("starts_at", dayStartIso(addDays(today, 1), center.timezone));

  return [
    `${plural(count ?? 0, "session")} today at ${center.name}`,
    inviteText,
  ]
    .filter(Boolean)
    .join(" · ");
}
