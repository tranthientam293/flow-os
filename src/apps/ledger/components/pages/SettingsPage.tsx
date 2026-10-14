import { House } from "lucide-react";
import { Button, Form, Input } from "antd";
import { SettingsPanel } from "@/components/molecules";
import { APP_NAME } from "@/constants";
import { useFlowApp } from "@/context";
import { useBackToPlatform } from "@/hooks";
import { PageTitle } from "../molecules";
import { MonthlyLimitSettings } from "../organisms";

export function SettingsPage() {
  const { app, user } = useFlowApp();
  const { backToPlatform, holder } = useBackToPlatform();

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6'>
      {holder}
      <PageTitle
        title='Settings'
        description={`Your spending limit and account in ${app.name}.`}
      />
      <MonthlyLimitSettings />
      <SettingsPanel
        title='Account'
        description={`${app.name} uses your ${APP_NAME} account.`}
      >
        <Form layout='vertical'>
          <Form.Item
            className='mb-0'
            label='Email'
            extra={`Your ${APP_NAME} sign-in email.`}
          >
            <Input value={user.email ?? ""} disabled />
          </Form.Item>
        </Form>
      </SettingsPanel>
      <SettingsPanel
        title={`Back to ${APP_NAME}`}
        description={`Leave ${app.name} and go back to the ${APP_NAME} home screen. You stay signed in.`}
      >
        <Button icon={<House />} onClick={backToPlatform}>
          Back to {APP_NAME}
        </Button>
      </SettingsPanel>
    </div>
  );
}
