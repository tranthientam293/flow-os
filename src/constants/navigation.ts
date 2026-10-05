import { Home, Settings, ShoppingBag } from "lucide-react";
import type { NavItem } from "@/types";
import { ROUTES } from "./routes";

export const PLATFORM_NAV: NavItem[] = [
  { label: "Overview", to: ROUTES.HOME, icon: Home, end: true },
  { label: "App Store", to: ROUTES.STORE, icon: ShoppingBag },
];

export const FOOTER_NAV: NavItem[] = [
  { label: "Settings", to: ROUTES.SETTINGS, icon: Settings },
];
