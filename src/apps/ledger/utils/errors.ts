import type { PostgrestError } from "@supabase/supabase-js";

const isPostgrestError = (error: unknown): error is PostgrestError =>
  !!error && typeof error === "object" && "code" in error && "message" in error;

export function friendlyError(error: unknown): Error {
  if (!isPostgrestError(error))
    return error instanceof Error ? error : new Error(String(error));
  return new Error(error.message);
}

export function check<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw friendlyError(result.error);
  return result.data as T;
}
