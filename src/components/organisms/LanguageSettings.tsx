import { useTranslation } from "react-i18next";
import { SettingsPanel } from "@/components/molecules";
import { LANGUAGES } from "@/constants";
import { useLanguageStore } from "@/stores";
import type { Language } from "@/types";

const optionClassName =
  "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border px-3 py-4 text-center text-sm text-foreground-light transition-colors hover:border-border-strong hover:text-foreground has-checked:border-brand has-checked:bg-brand-soft has-checked:text-foreground has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50";

export function LanguageSettings() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  const radio = (value: Language) => (
    <input
      type='radio'
      name='language'
      value={value}
      checked={language === value}
      onChange={() => setLanguage(value)}
      className='sr-only'
    />
  );

  return (
    <SettingsPanel
      title={t("settings.language.title")}
      description={t("settings.language.description")}
    >
      <fieldset className='grid grid-cols-2 gap-3'>
        <legend className='sr-only'>{t("language.label")}</legend>
        {LANGUAGES.map((option) => (
          <label key={option.value} className={optionClassName}>
            {radio(option.value)}
            <span className='font-mono text-xs text-muted-foreground'>
              {option.short}
            </span>
            {option.label}
          </label>
        ))}
      </fieldset>
    </SettingsPanel>
  );
}
