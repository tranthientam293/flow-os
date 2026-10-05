import { mutationOptions } from "@tanstack/react-query";
import { supabase } from "@/libs";
import type { SignInPayload, SignUpPayload, SignUpResult } from "@/models";

export const signInMutationOptions = () =>
  mutationOptions({
    mutationFn: async ({ email, password }: SignInPayload) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
  });

export const signUpMutationOptions = () =>
  mutationOptions({
    mutationFn: async ({
      email,
      password,
      displayName,
    }: SignUpPayload): Promise<SignUpResult> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName?.trim() || undefined },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return { needsEmailConfirmation: !data.session };
    },
  });

export const signOutMutationOptions = () =>
  mutationOptions({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    meta: { errorMessage: "Could not log out" },
  });
