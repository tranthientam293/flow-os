import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { i18n, queryClient, supabase } from "@/libs";
import type { Profile, ProfileUpdate } from "@/models";

export const profileQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.profile(userId),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const updateProfileMutationOptions = (userId: string) =>
  mutationOptions({
    mutationFn: async (changes: ProfileUpdate): Promise<Profile> => {
      const { data, error } = await supabase
        .from("profiles")
        .update(changes)
        .eq("id", userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (profile) =>
      queryClient.setQueryData(profileQueryOptions(userId).queryKey, profile),
    meta: {
      successMessage: () => i18n.t("toast.profileSaved"),
      errorMessage: () => i18n.t("toast.profileSaveFailed"),
    },
  });
