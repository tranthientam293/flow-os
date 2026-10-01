import type { ParseKeys } from "i18next";
import type { en } from "@/locales";

export type Language = "en" | "vi";

export type LanguageOption = { value: Language; label: string; short: string };

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

export type TranslationSchema = Widen<typeof en>;

export type TranslationKey = ParseKeys;

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
  }
}
