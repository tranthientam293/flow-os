import type { PostgrestError } from "@supabase/supabase-js";
import { OVERLAP_CONSTRAINT } from "../constants/options";

const isPostgrestError = (error: unknown): error is PostgrestError =>
  !!error && typeof error === "object" && "code" in error && "message" in error;

export function friendlyError(error: unknown): Error {
  if (!isPostgrestError(error))
    return error instanceof Error ? error : new Error(String(error));

  const { code, message } = error;
  if (code === "23P01" || message.includes(OVERLAP_CONSTRAINT))
    return new Error("That time overlaps another session for the same person.");
  if (code === "42501" && message.includes("row-level security"))
    return new Error(
      "You can’t make this change. It may be outside your booking range or at a branch you aren’t assigned to.",
    );
  if (code === "23505") return new Error("That name or code is already used.");
  if (code === "23503")
    return new Error(
      "It still has sessions linked to it. Archive or deactivate it instead.",
    );
  return new Error(message);
}

export function check<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw friendlyError(result.error);
  return result.data as T;
}
