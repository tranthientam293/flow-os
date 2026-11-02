import { useState } from "react";
import { ListFilter, X } from "lucide-react";
import { Button, Grid, Modal } from "antd";
import { CATEGORY_BY_ID } from "../../constants/categories";
import { MODAL_TRANSITION, MODAL_WIDTH } from "../../constants/modal";
import { CategoryIcon } from "../atoms";
import { CategoryList } from "./CategoryPicker";

interface CategoryFilterProps {
  value?: string;
  onChange: (id?: string) => void;
}

// Picks one top-level category to filter by, covering its subcategories.
// On desktop picking a category applies it and ✕ clears it. On phones the
// button is just the filter icon, with a dot while filtering, and the dialog
// only changes the filter on Apply or Clear.
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const phone = Grid.useBreakpoint().sm === false;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const selected = value ? CATEGORY_BY_ID.get(value) : undefined;
  const label = selected
    ? `Filtered by ${selected.name}`
    : "Filter by category";

  const apply = (id?: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className='flex min-w-0 items-center gap-1'>
      <Button
        icon={
          <>
            <ListFilter className='size-4 sm:hidden' />
            {selected ? (
              <span className='flex max-sm:hidden'>
                <CategoryIcon category={selected} />
              </span>
            ) : (
              <ListFilter className='size-4 max-sm:hidden' />
            )}
          </>
        }
        onClick={() => {
          setDraft(value);
          setOpen(true);
        }}
        title={label}
        aria-label={label}
        className='max-w-56 min-w-0 max-sm:aspect-square max-sm:px-0'
      >
        <span className='truncate max-sm:hidden'>
          {selected ? selected.name : "All categories"}
        </span>
        {selected && (
          <span className='absolute -end-1 -top-1 size-2.5 rounded-full bg-brand ring-2 ring-background sm:hidden' />
        )}
      </Button>
      {selected && !phone && (
        <Button
          type='text'
          danger
          icon={<X />}
          title='Clear filter'
          aria-label='Clear filter'
          onClick={() => onChange(undefined)}
        />
      )}
      <Modal
        open={open}
        title='Filter by category'
        onCancel={() => setOpen(false)}
        footer={
          phone ? (
            <div className='flex gap-2 border-t pt-4'>
              <Button
                danger
                type='text'
                icon={<X />}
                disabled={!value}
                onClick={() => apply(undefined)}
                className='h-11'
              >
                Clear
              </Button>
              <Button
                type='primary'
                disabled={draft === value}
                onClick={() => apply(draft)}
                className='h-11 flex-1'
              >
                Apply
              </Button>
            </div>
          ) : null
        }
        width={MODAL_WIDTH}
        destroyOnHidden
        transitionName={MODAL_TRANSITION}
      >
        <CategoryList
          fill={false}
          parentsOnly
          value={phone ? draft : value}
          onSelect={phone ? setDraft : apply}
        />
      </Modal>
    </div>
  );
}
