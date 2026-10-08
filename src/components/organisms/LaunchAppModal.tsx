import { useState } from "react";
import { useNavigate } from "react-router";
import { Modal } from "antd";
import { getApp } from "@/apps";
import { AppIcon } from "@/components/atoms";
import { APP_NAME, appPath } from "@/constants";
import { useUiStore } from "@/stores";

export function LaunchAppModal() {
  const navigate = useNavigate();
  const appId = useUiStore((s) => s.launchingAppId);
  const setLaunchingAppId = useUiStore((s) => s.setLaunchingAppId);
  const pending = getApp(appId ?? undefined);
  // Keeps the content in place while the modal animates closed.
  const [app, setApp] = useState(pending);
  if (pending && pending !== app) setApp(pending);
  const close = () => setLaunchingAppId(null);

  return (
    <Modal
      open={!!pending}
      title={app && `Open ${app.name}?`}
      okText='Open'
      onOk={() => {
        if (app) navigate(appPath(app.id));
        close();
      }}
      onCancel={close}
      width={400}
      destroyOnHidden
    >
      {app && (
        <div className='flex items-start gap-3'>
          <AppIcon icon={app.icon} size='lg' />
          <div className='min-w-0 space-y-1 text-sm'>
            <p className='text-foreground'>{app.tagline}</p>
            <p className='text-muted-foreground'>
              {app.name} opens full screen. Use “Back to {APP_NAME}” in the app
              to return here.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
