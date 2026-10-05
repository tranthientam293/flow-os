import { PageHeader } from "@/components/molecules";
import { AppearanceSettings, ProfileSettings } from "@/components/organisms";

export function SettingsPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10'>
      <PageHeader
        title='Settings'
        description='Manage your account and how flowOS looks.'
      />
      <div className='mt-8 flex flex-col gap-6'>
        <ProfileSettings />
        <AppearanceSettings />
      </div>
    </div>
  );
}
