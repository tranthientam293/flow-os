import { useEffect, type ReactNode } from "react";
import { StyleProvider } from "@ant-design/cssinjs";
import { App, ConfigProvider } from "antd";
import { SpinnerIcon } from "@/components/atoms";
import { useResolvedTheme } from "@/hooks";
import { bindNotification, getAntdTheme } from "@/libs";

function NotificationBridge() {
  const { notification } = App.useApp();
  useEffect(() => bindNotification(notification), [notification]);
  return null;
}

// `layer` puts antd styles in `@layer antd`, which index.css orders before
// Tailwind utilities, so a className always wins over antd's own styles.
export function AntdProvider({ children }: { children: ReactNode }) {
  const mode = useResolvedTheme();
  return (
    <StyleProvider layer>
      <ConfigProvider
        theme={getAntdTheme(mode)}
        wave={{ disabled: true }}
        spin={{ indicator: <SpinnerIcon /> }}
        tooltip={{ arrow: false }}
      >
        <App
          component={false}
          notification={{ placement: "bottomRight", duration: 4 }}
        >
          <NotificationBridge />
          {children}
        </App>
      </ConfigProvider>
    </StyleProvider>
  );
}
