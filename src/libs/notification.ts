import type { NotificationInstance } from "antd/es/notification/interface";

// Antd's static notification API can't read ConfigProvider (theme, locale),
// so <NotificationBridge /> hands us the context-aware instance from App.useApp().
let instance: NotificationInstance | null = null;

export function bindNotification(api: NotificationInstance) {
  instance = api;
}

export const notify = {
  success: (message: string, description?: string) =>
    instance?.success({ message, description }),
  error: (message: string, description?: string) =>
    instance?.error({ message, description }),
};
