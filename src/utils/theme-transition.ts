import { flushSync } from "react-dom";

export function withThemeTransition(update: () => void) {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("startViewTransition" in document) || reduceMotion) return update();

  document.startViewTransition(() => flushSync(update));
}
