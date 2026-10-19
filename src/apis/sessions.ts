import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { notify, queryClient, supabase } from "@/libs";
import type { AuthSession, RevokeStatus } from "@/models";

export const sessionsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.sessions(userId),
    queryFn: async (): Promise<AuthSession[]> => {
      const { data, error } = await supabase.rpc("list_my_sessions");
      if (error) throw error;
      return data;
    },
  });

// Signing devices out needs your password, checked by the database. A wrong
// password resolves with its status (shown on the password field) rather
// than throwing, so only real failures raise a toast.
interface RevokeSessionsVariables {
  password: string;
  // One other device to sign out; every device, this one included, when
  // left out.
  sessionId?: string;
}

export const revokeSessionsMutationOptions = (userId: string) =>
  mutationOptions({
    mutationFn: async ({
      password,
      sessionId,
    }: RevokeSessionsVariables): Promise<RevokeStatus> => {
      const { data, error } = sessionId
        ? await supabase.rpc("revoke_my_session", {
            p_session_id: sessionId,
            p_password: password,
          })
        : await supabase.rpc("revoke_all_my_sessions", {
            p_password: password,
          });
      if (error) throw error;
      // This device's session is gone too: clear it here, which signs out
      // and sends the user to sign in.
      if (!sessionId && data === "ok")
        await supabase.auth.signOut({ scope: "local" });
      return data as RevokeStatus;
    },
    onSuccess: async (status, { sessionId }) => {
      if (status !== "ok") return;
      if (!sessionId) return notify.success("Signed out of all devices");
      notify.success("Device signed out");
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.sessions(userId),
      });
    },
    meta: { errorMessage: "Could not sign out" },
  });
