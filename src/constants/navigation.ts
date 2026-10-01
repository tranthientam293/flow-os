import { Home, LayoutGrid, Settings } from "lucide-react";
import type { NavItem } from "@/types";
import { ROUTES } from "./routes";

export const PLATFORM_NAV: NavItem[] = [
  { labelKey: "nav.overview", to: ROUTES.HOME, icon: Home, end: true },
  { labelKey: "nav.appStore", to: ROUTES.STORE, icon: LayoutGrid },
];

export const FOOTER_NAV: NavItem[] = [
  { labelKey: "nav.settings", to: ROUTES.SETTINGS, icon: Settings },
];
