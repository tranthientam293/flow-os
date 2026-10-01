import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "./i18n";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export type ThemeOption = {
  value: ThemePreference;
  labelKey: TranslationKey;
  icon: LucideIcon;
};
