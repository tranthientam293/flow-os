import type { ComponentType, LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";
import type { APP_CATEGORIES } from "@/constants";
import type { SupabaseClient } from "@/libs";

export type AppCategory = (typeof APP_CATEGORIES)[number];

export interface AppManifest {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  category: AppCategory;
  version: string;
  load: () => Promise<{ default: ComponentType }>;
  getSummary?: (ctx: {
    supabase: SupabaseClient;
    userId: string;
  }) => Promise<string | null>;
}

export type RegisteredApp = AppManifest & {
  Component: LazyExoticComponent<ComponentType>;
};
