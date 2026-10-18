import { cn } from "@/utils";
import {
  CATEGORY_TONE_CLASS,
  type ExpenseCategory,
} from "../../constants/categories";

interface CategoryIconProps {
  category: ExpenseCategory;
  size?: "md" | "lg";
}

export function CategoryIcon({ category, size = "md" }: CategoryIconProps) {
  const Icon = category.icon;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        CATEGORY_TONE_CLASS[category.tone],
        size === "md" ? "size-6" : "size-9",
      )}
    >
      <Icon className={size === "md" ? "size-3.5" : "size-4.5"} />
    </span>
  );
}
