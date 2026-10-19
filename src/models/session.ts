import type { Database } from "./database";

// A device signed in to the account (one auth.sessions row).
export type AuthSession =
  Database["public"]["Functions"]["list_my_sessions"]["Returns"][number];

// What a password-confirmed sign-out returned.
export type RevokeStatus = "ok" | "wrong_password" | "too_many_attempts";
