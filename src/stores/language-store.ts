import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LANGUAGE, LANGUAGES, STORAGE_KEYS } from "@/constants";
import type { Language } from "@/types";

type LanguageState = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some((option) => option.value === value);

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: DEFAULT_LANGUAGE,
      setLanguage: (language) => set({ language }),
    }),
    {
      name: STORAGE_KEYS.LANGUAGE,
      version: 2,
      migrate: (persisted) => {
        const previous = (persisted as { preference?: unknown } | undefined)
          ?.preference;
        return {
          language: isLanguage(previous) ? previous : DEFAULT_LANGUAGE,
        } as LanguageState;
      },
    },
  ),
);
