import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Wordmark,
} from "@/components/atoms";
import { useUiStore } from "@/stores";
import { Sidebar } from "./Sidebar";

export function MobileNav() {
  const { t } = useTranslation();
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side='left' className='w-[min(16rem,85vw)] gap-0 p-0'>
        <SheetHeader className='border-b px-4 py-3'>
          <SheetTitle>
            <Wordmark className='text-base' />
          </SheetTitle>
          <SheetDescription className='sr-only'>
            {t("nav.main")}
          </SheetDescription>
        </SheetHeader>
        <Sidebar onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
