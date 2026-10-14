import { useLayoutEffect, useRef, type RefObject } from "react";
import { useLocation } from "react-router";

// Scrolls `ref` (a layout's scrolling <main>) back to the top whenever the
// path changes, so a new page never opens halfway down. Query-only changes
// (e.g. Ledger's ?month=) keep the scroll position.
export function useScrollTopOnNavigate(ref: RefObject<HTMLElement | null>) {
  const { pathname } = useLocation();
  const lastPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    ref.current?.scrollTo({ top: 0 });
  }, [ref, pathname]);
}
