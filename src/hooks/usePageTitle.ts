import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { getApp } from "@/apps";
import { ROUTES } from "@/constants";

export function usePageTitle(): string {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  if (pathname === ROUTES.HOME) return t("nav.overview");
  if (pathname.startsWith(ROUTES.STORE)) return t("nav.appStore");
  if (pathname.startsWith(ROUTES.SETTINGS)) return t("nav.settings");
  const appId = pathname.match(/^\/apps\/([^/]+)/)?.[1];
  if (appId) return getApp(appId)?.name ?? t("pageTitle.unknownApp");
  return t("pageTitle.notFound");
}

export function useCurrentApp() {
  const { pathname } = useLocation();
  return getApp(pathname.match(/^\/apps\/([^/]+)/)?.[1]);
}
