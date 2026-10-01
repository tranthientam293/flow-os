import { useEffect, useSyncExternalStore } from "react";
import { useThemeStore } from "@/stores";
import type { ResolvedTheme } from "@/types";

const query = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const getSystemDark = () => window.matchMedia(query).matches;

export function useResolvedTheme(): ResolvedTheme {
  const preference = useThemeStore((s) => s.preference);
  const systemDark = useSyncExternalStore(subscribe, getSystemDark);
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}

export function useThemeSync() {
  const resolved = useResolvedTheme();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);
}
