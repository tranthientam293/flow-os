import { Drawer } from "antd";
import { Wordmark } from "@/components/atoms";
import { useUiStore } from "@/stores";
import { Sidebar } from "./Sidebar";

export function MobileNav() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      placement='left'
      size='min(16rem, 85vw)'
      title={<Wordmark className='text-base' />}
      closable={{ placement: "end" }}
      classNames={{ header: "px-4 py-3", body: "p-0" }}
    >
      <Sidebar onNavigate={() => setOpen(false)} />
    </Drawer>
  );
}
