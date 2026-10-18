import { useEffect, useMemo, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider, notification } from "antd";
import { SpinnerIcon } from "@/components/atoms";
import { useResolvedTheme } from "@/hooks";
import { bindNotification, getAntdTheme } from "@/libs";

// Only notifications are needed, so use the hook rather than antd's <App>,
// which also bundles modal and message.
function NotificationBridge() {
  const [api, contextHolder] = notification.useNotification({
    placement: "topRight",
    duration: 4,
  });
  useEffect(() => bindNotification(api), [api]);
  return contextHolder;
}

// Popups opened in a modal render into it, so antd.css can show them as
// bottom sheets on phones.
const popupContainer = (trigger?: HTMLElement) =>
  trigger?.closest<HTMLElement>(".ant-modal-wrap") ?? document.body;

interface AntdProviderProps {
  children: ReactNode;
}

export function AntdProvider({ children }: AntdProviderProps) {
  const mode = useResolvedTheme();
  const theme = useMemo(() => getAntdTheme(mode), [mode]);
  return (
    <StyleProvider layer>
      <ConfigProvider
        theme={theme}
        getPopupContainer={popupContainer}
        wave={{ disabled: true }}
        spin={{ indicator: <SpinnerIcon /> }}
        tooltip={{ arrow: false }}
        form={{ requiredMark: false }}
        alert={{
          successIcon: <CircleCheck />,
          infoIcon: <Info />,
          warningIcon: <TriangleAlert />,
          errorIcon: <CircleAlert />,
        }}
      >
        <NotificationBridge />
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
