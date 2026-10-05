import type { LucideIcon } from "lucide-react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export type ThemeOption = {
  value: ThemePreference;
  label: string;
  icon: LucideIcon;
};
