import { APP_NAME } from "@/constants";

const COPYRIGHT_YEAR = new Date().getFullYear();

export function AppFooter() {
  return (
    <footer className='mt-auto px-4 pt-8 pb-10 text-center text-[11px] text-muted-foreground/70 sm:pb-6'>
      Original by tranthientam2903 · © {COPYRIGHT_YEAR} {APP_NAME}
    </footer>
  );
}
