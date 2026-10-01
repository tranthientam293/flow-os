import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/models";

export function getDisplayName(
  user: User | null,
  profile: Profile | null | undefined,
): string {
  return profile?.display_name || user?.email?.split("@")[0] || "there";
}

export function getInitials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}
