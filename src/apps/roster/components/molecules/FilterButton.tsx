import { useState, type ReactNode } from "react";
import { ListFilter } from "lucide-react";
import { Badge, Button, Modal, Tooltip } from "antd";

// An icon button that opens the filters in a modal. Changes are a draft until
// Apply; closing the modal drops them. The badge shows how many are active.
export function FilterButton<T>({
  value,
  empty,
  count,
  onApply,
  children,
}: {
  value: T;
  // The filters with nothing selected, for Clear all.
  empty: T;
  count: (filters: T) => number;
  onApply: (filters: T) => void;
  children: (draft: T, change: (patch: Partial<T>) => void) => ReactNode;
}) {
  const [draft, setDraft] = useState<T | null>(null);
  const active = count(value);
  const change = (patch: Partial<T>) =>
    setDraft((d) => ({ ...(d ?? value), ...patch }));

  return (
    <>
      <Tooltip title='Filters'>
        <Badge
          count={active}
          size='small'
          color='var(--primary)'
          // Block-level, so it doesn't sit on the text baseline and lift the button.
          className='flex'
        >
          <Button
            icon={<ListFilter />}
            aria-label={active ? `Filters (${active} active)` : "Filters"}
            onClick={() => setDraft(value)}
          />
        </Badge>
      </Tooltip>
      <Modal
        open={draft !== null}
        title='Filters'
        onCancel={() => setDraft(null)}
        width={420}
        footer={
          <div className='flex items-center gap-2'>
            <Button
              disabled={!draft || !count(draft)}
              onClick={() => setDraft(empty)}
            >
              Clear all
            </Button>
            <Button
              type='primary'
              className='ms-auto'
              onClick={() => {
                if (draft) onApply(draft);
                setDraft(null);
              }}
            >
              Apply
            </Button>
          </div>
        }
      >
        {draft && (
          <div className='flex flex-col gap-4 py-2'>
            {children(draft, change)}
          </div>
        )}
      </Modal>
    </>
  );
}

// One labelled filter inside the modal.
export function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <span className='text-sm text-foreground'>{label}</span>
      {children}
    </div>
  );
}
