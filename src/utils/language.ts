import { LANGUAGES } from "@/constants";
import type { Language } from "@/types";

export const languageLabel = (language: Language) =>
  LANGUAGES.find((option) => option.value === language)?.label ?? language;

export const languageShort = (language: Language) =>
  LANGUAGES.find((option) => option.value === language)?.short ??
  language.toUpperCase();
