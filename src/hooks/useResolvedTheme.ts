import { useLayoutEffect, useSyncExternalStore } from "react";
import { useThemeStore } from "@/stores";
import type { ResolvedTheme } from "@/types";
import { withThemeTransition } from "@/utils";

const query = "(prefers-color-scheme: dark)";

// One shared OS-theme listener, so a system change updates every subscriber
// inside a single animated transition (one per subscriber would cancel each
// other).
const listeners = new Set<() => void>();
let listening = false;

const notify = () => listeners.forEach((listener) => listener());

function subscribe(onChange: () => void) {
  if (!listening) {
    listening = true;
    matchMedia(query).addEventListener("change", () => {
      if (useThemeStore.getState().preference === "system")
        withThemeTransition(notify);
      else notify();
    });
  }
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

const getSystemDark = () => matchMedia(query).matches;

export function useResolvedTheme(): ResolvedTheme {
  const preference = useThemeStore((s) => s.preference);
  const systemDark = useSyncExternalStore(subscribe, getSystemDark);
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}

// Switches the `.dark` class without a flicker:
// - useLayoutEffect applies it before paint, in the same commit antd gets its
//   new theme, so Tailwind/tokens.css and antd never show different themes.
// - Transitions are paused for the switch; otherwise every `transition-colors`
//   element and antd control fades on its own timing.
export function useThemeSync() {
  const resolved = useResolvedTheme();
  useLayoutEffect(() => {
    const root = document.documentElement;
    const dark = resolved === "dark";
    // Already set by the inline script in index.html on first load.
    if (root.classList.contains("dark") === dark) return;

    const pause = document.createElement("style");
    pause.textContent = "*,*::before,*::after{transition:none!important}";
    document.head.appendChild(pause);
    root.classList.toggle("dark", dark);
    // Force a style recalc so the new colours apply with transitions off,
    // then re-enable them after the next paint.
    void getComputedStyle(root).color;
    requestAnimationFrame(() => requestAnimationFrame(() => pause.remove()));
  }, [resolved]);
}
