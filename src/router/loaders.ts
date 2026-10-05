import { profileQueryOptions } from "@/apis";
import { queryClient, supabase } from "@/libs";

export async function appLoader() {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;

  if (userId)
    await queryClient.query({
      ...profileQueryOptions(userId),
      staleTime: "static",
    });
  return null;
}
