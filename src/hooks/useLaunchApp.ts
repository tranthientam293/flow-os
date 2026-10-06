import type { MouseEvent } from "react";
import { useUiStore } from "@/stores";

// Click handler for links to an app: asks for confirmation (LaunchAppModal)
// instead of navigating. Modified clicks still open the app in a new tab.
export function useLaunchApp() {
  const setLaunchingAppId = useUiStore((s) => s.setLaunchingAppId);
  return (appId: string) => (event?: MouseEvent) => {
    if (
      event &&
      (event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey)
    )
      return;
    event?.preventDefault();
    setLaunchingAppId(appId);
  };
}
