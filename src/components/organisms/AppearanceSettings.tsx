import { useTranslation } from "react-i18next";
import { SettingsPanel } from "@/components/molecules";
import { THEME_OPTIONS } from "@/constants";
import { useThemeStore } from "@/stores";

export function AppearanceSettings() {
  const { t } = useTranslation();
  const { preference, setPreference } = useThemeStore();

  return (
    <SettingsPanel
      title={t("settings.appearance.title")}
      description={t("settings.appearance.description")}
    >
      <fieldset className='grid grid-cols-3 gap-3'>
        <legend className='sr-only'>{t("theme.label")}</legend>
        {THEME_OPTIONS.map(({ value, labelKey, icon: Icon }) => (
          <label
            key={value}
            className='flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-3 py-4 text-center text-sm text-foreground-light transition-colors hover:border-border-strong hover:text-foreground has-checked:border-brand has-checked:bg-brand-soft has-checked:text-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring/50'
          >
            <input
              type='radio'
              name='theme'
              value={value}
              checked={preference === value}
              onChange={() => setPreference(value)}
              className='sr-only'
            />
            <Icon className='size-4.5' strokeWidth={1.5} />
            {t(labelKey)}
          </label>
        ))}
      </fieldset>
    </SettingsPanel>
  );
}
