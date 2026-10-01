import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils";

const sizes = {
  sm: { box: "size-6 rounded", icon: "size-3.5" },
  md: { box: "size-9 rounded-md", icon: "size-[18px]" },
  lg: { box: "size-12 rounded-lg", icon: "size-[22px]" },
};

function AppIcon({
  icon: Icon,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border border-border bg-surface-muted text-brand-strong",
        sizes[size].box,
        className,
      )}
    >
      <Icon className={sizes[size].icon} strokeWidth={1.75} />
    </div>
  );
}

export { AppIcon };
