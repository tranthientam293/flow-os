import { Monitor, Moon, Sun } from "lucide-react";
import type { ThemeOption } from "@/types";

export const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];
