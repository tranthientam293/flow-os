import { SettingsPanel } from "@/components/molecules";
import { THEME_OPTIONS } from "@/constants";
import { useThemeStore } from "@/stores";
import { withThemeTransition } from "@/utils";

export function AppearanceSettings() {
  const { preference, setPreference } = useThemeStore();

  return (
    <SettingsPanel
      title='Appearance'
      description='Choose a theme, or follow your operating system.'
    >
      <fieldset className='grid grid-cols-3 gap-3'>
        <legend className='sr-only'>Theme</legend>
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className='flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-3 py-4 text-center text-sm text-foreground-light transition-colors hover:border-border-strong hover:text-foreground has-checked:border-brand has-checked:bg-brand-soft has-checked:text-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring/50'
          >
            <input
              type='radio'
              name='theme'
              value={value}
              checked={preference === value}
              onChange={() => withThemeTransition(() => setPreference(value))}
              className='sr-only'
            />
            <Icon className='size-4.5' strokeWidth={1.5} />
            {label}
          </label>
        ))}
      </fieldset>
    </SettingsPanel>
  );
}
