import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "./i18n";

export type NavItem = {
  labelKey: TranslationKey;
  to: string;
  icon: LucideIcon;
  end?: boolean;
};
