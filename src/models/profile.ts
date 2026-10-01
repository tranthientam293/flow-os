import type { Tables, TablesUpdate } from "./database";

export type Profile = Tables<"profiles">;

export type ProfileUpdate = Pick<
  TablesUpdate<"profiles">,
  "display_name" | "avatar_url"
>;
