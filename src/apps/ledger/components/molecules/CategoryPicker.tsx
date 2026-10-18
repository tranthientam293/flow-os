import { useMemo, useState } from "react";
import { Check, ChevronRight, Search } from "lucide-react";
import { Form, Input, Modal } from "antd";
import { cn } from "@/utils";
import {
  CATEGORY_BY_ID,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "../../constants/categories";
import { MODAL_TRANSITION, MODAL_WIDTH } from "../../constants/modal";
import { CategoryIcon } from "../atoms";

const matches = (category: ExpenseCategory, query: string) =>
  category.name.toLowerCase().includes(query);

interface CategoryPickerProps {
  id?: string;
  value?: string;
  onChange?: (id: string) => void;
}

export function CategoryPicker({ id, value, onChange }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState<number>();
  const { status } = Form.Item.useStatus();
  const selected = value ? CATEGORY_BY_ID.get(value) : undefined;

  return (
    <>
      <button
        id={id}
        type='button'
        onClick={(e) => {
          setHeight(
            e.currentTarget
              .closest(".ant-modal-container")
              ?.getBoundingClientRect().height,
          );
          setOpen(true);
        }}
        className={cn(
          "flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-border-strong bg-surface-muted px-3 text-start text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          status === "error" && "border-destructive",
        )}
      >
        {selected ? (
          <>
            <CategoryIcon category={selected} />
            <span className='min-w-0 flex-1 truncate text-foreground'>
              {selected.name}
            </span>
          </>
        ) : (
          <span className='flex-1 text-muted-foreground'>Select category</span>
        )}
        <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
      </button>
      <Modal
        open={open}
        title='Select category'
        onCancel={() => setOpen(false)}
        footer={null}
        width={MODAL_WIDTH}
        destroyOnHidden
        transitionName={MODAL_TRANSITION}
        classNames={{
          container: "flex flex-col",
          body: "flex min-h-0 flex-1 flex-col",
        }}
        styles={{ container: { height } }}
      >
        <CategoryList
          fill={height !== undefined}
          value={value}
          onSelect={(category) => {
            onChange?.(category);
            setOpen(false);
          }}
        />
      </Modal>
    </>
  );
}

interface CategoryListProps {
  fill: boolean;
  value?: string;
  onSelect: (id: string) => void;
}

function CategoryList({ fill, value, onSelect }: CategoryListProps) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EXPENSE_CATEGORIES;
    return EXPENSE_CATEGORIES.flatMap((parent) => {
      if (matches(parent, q)) return [parent];
      const children = (parent.children ?? []).filter((c) => matches(c, q));
      return children.length ? [{ ...parent, children }] : [];
    });
  }, [query]);

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-3'>
      <Input
        allowClear
        prefix={<Search className='size-4 text-muted-foreground' />}
        placeholder='Search categories'
        aria-label='Search categories'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        // 16px on phones so iOS doesn't zoom in when it's focused.
        className='text-base sm:text-sm'
      />
      <div
        className={cn(
          "-mx-2 overflow-y-auto",
          fill ? "min-h-0 flex-1" : "max-h-[60vh]",
        )}
      >
        {groups.length ? (
          <ul className='flex flex-col'>
            {groups.map((parent) => (
              <li key={parent.id}>
                <CategoryRow
                  category={parent}
                  selected={parent.id === value}
                  onSelect={onSelect}
                />
                {parent.children?.length ? (
                  <ul className='ms-5 border-s ps-2'>
                    {parent.children.map((child) => (
                      <li key={child.id}>
                        <CategoryRow
                          category={child}
                          selected={child.id === value}
                          onSelect={onSelect}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className='px-2 py-6 text-center text-sm text-muted-foreground'>
            No categories match “{query.trim()}”.
          </p>
        )}
      </div>
    </div>
  );
}

interface CategoryRowProps {
  category: ExpenseCategory;
  selected: boolean;
  onSelect: (id: string) => void;
}

function CategoryRow({ category, selected, onSelect }: CategoryRowProps) {
  return (
    <button
      type='button'
      onClick={() => onSelect(category.id)}
      aria-pressed={selected}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-start text-sm text-foreground outline-none hover:bg-accent focus-visible:bg-accent",
        selected && "bg-accent font-medium",
      )}
    >
      <CategoryIcon category={category} size='lg' />
      <span className='min-w-0 flex-1 truncate'>{category.name}</span>
      {selected && <Check className='size-4 shrink-0 text-brand-strong' />}
    </button>
  );
}
