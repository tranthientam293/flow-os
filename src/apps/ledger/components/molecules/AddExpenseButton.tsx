import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "antd";
import { useExpenseEditor } from "../../context/expense-editor-context";

interface AddExpenseButtonProps {
  onClick: () => void;
}

export function AddExpenseButton({ onClick }: AddExpenseButtonProps) {
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
