import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "antd";
import { useExpenseEditor } from "../../context/expense-editor-context";

// "Add expense" on computers, placed by the caller. While it's scrolled out
// of view, the header shows its own Add expense (LedgerHeader) that does the
// same. Phones use the round + in the bottom bar (LedgerBottomBar) instead.
export function AddExpenseButton({ onClick }: { onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { setHeaderAdd } = useExpenseEditor();
  // The latest onClick, so the header's copy never runs a stale one.
  const onClickRef = useRef(onClick);
  useEffect(() => {
    onClickRef.current = onClick;
  });

  useEffect(() => {
    const button = ref.current;
    if (!button) return;
    const add = () => onClickRef.current();
    const observer = new IntersectionObserver(([entry]) =>
      setHeaderAdd(entry.isIntersecting ? null : add),
    );
    observer.observe(button);
    return () => {
      observer.disconnect();
      setHeaderAdd(null);
    };
  }, [setHeaderAdd]);

  return (
    <Button
      ref={ref}
      type='primary'
      icon={<Plus />}
      className='hidden sm:inline-flex'
      onClick={onClick}
    >
      Add expense
    </Button>
  );
}
