import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/molecules";
import {
  AppearanceSettings,
  LanguageSettings,
  ProfileSettings,
} from "@/components/organisms";

export function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className='mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10'>
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />
      <div className='mt-8 flex flex-col gap-6'>
        <ProfileSettings />
        <AppearanceSettings />
        <LanguageSettings />
      </div>
    </div>
  );
}
