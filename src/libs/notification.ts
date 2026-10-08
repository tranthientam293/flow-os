import type { NotificationInstance } from "antd/es/notification/interface";

// Antd's static notification API can't read ConfigProvider (theme, locale),
// so <NotificationBridge /> hands us the context-aware instance from notification.useNotification().
let instance: NotificationInstance | null = null;

export function bindNotification(api: NotificationInstance) {
  instance = api;
}

export const notify = {
  success: (message: string, description?: string) =>
    instance?.success({ title: message, description }),
  error: (message: string, description?: string) =>
    instance?.error({ title: message, description }),
};
