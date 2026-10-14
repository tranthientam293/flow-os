import { APP_NAME } from "@/constants";

// Read once when the app loads.
const COPYRIGHT_YEAR = new Date().getFullYear();

// A quiet copyright line at the bottom of an app. Place it last in a
// full-height flex column; `mt-auto` keeps it at the bottom of short pages.
// The extra bottom space on phones keeps it clear of a bottom bar's raised
// button.
export function AppFooter() {
  return (
    <footer className='mt-auto px-4 pt-8 pb-10 text-center text-[11px] text-muted-foreground/70 sm:pb-6'>
      Original by tranthientam2903 · © {COPYRIGHT_YEAR} {APP_NAME}
    </footer>
  );
}
