import type { LanguageOption } from "@/types";

export const LANGUAGES = [
  { value: "en", label: "English", short: "EN" },
  { value: "vi", label: "Tiếng Việt", short: "VI" },
] as const satisfies readonly LanguageOption[];

export const DEFAULT_LANGUAGE = "en";
