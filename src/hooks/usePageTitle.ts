import { useLocation } from "react-router";
import { getApp } from "@/apps";
import { ROUTES } from "@/constants";

export function usePageTitle(): string {
  const { pathname } = useLocation();
  if (pathname === ROUTES.HOME) return "Overview";
  if (pathname.startsWith(ROUTES.STORE)) return "App Store";
  if (pathname.startsWith(ROUTES.SETTINGS)) return "Settings";
  const appId = pathname.match(/^\/apps\/([^/]+)/)?.[1];
  if (appId) return getApp(appId)?.name ?? "Unknown app";
  return "Not found";
}

export function useCurrentApp() {
  const { pathname } = useLocation();
  return getApp(pathname.match(/^\/apps\/([^/]+)/)?.[1]);
}
