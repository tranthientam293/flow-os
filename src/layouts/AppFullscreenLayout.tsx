import { useEffect, useRef } from "react";
import { Outlet } from "react-router";
import { APP_NAME } from "@/constants";
import { usePageTitle, useScrollTopOnNavigate } from "@/hooks";

// Apps run full screen with no platform chrome; each app gives the user a way
// back to the flowOS home (navigate to ROUTES.HOME).
export function AppFullscreenLayout() {
  const title = usePageTitle();
  const mainRef = useRef<HTMLElement>(null);
  useScrollTopOnNavigate(mainRef);

  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);

  return (
    <main ref={mainRef} className='h-full overflow-y-auto bg-background'>
      <Outlet />
    </main>
  );
}
