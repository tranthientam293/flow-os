import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE } from "@/constants";
import { en, vi } from "@/locales";
import { useLanguageStore } from "@/stores";
import type { Language } from "@/types";
import { dayjs } from "./dayjs";

const applyLanguage = (language: Language) => {
  dayjs.locale(language);
  document.documentElement.lang = language;
};

const currentLanguage = () => useLanguageStore.getState().language;

const initialLanguage = currentLanguage();
applyLanguage(initialLanguage);

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, vi: { translation: vi } },
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: ["en", "vi"],
  interpolation: { escapeValue: false },
  returnNull: false,
});

const syncLanguage = () => {
  const language = currentLanguage();
  if (language === i18n.language) return;
  applyLanguage(language);
  void i18n.changeLanguage(language);
};

useLanguageStore.subscribe(syncLanguage);

export { i18n };
