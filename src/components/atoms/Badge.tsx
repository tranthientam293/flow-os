import type { ReactNode } from "react";
import { Tag } from "antd";
import { cn } from "@/utils";

const variants = {
  status: "border-border-strong bg-surface-muted text-foreground-light",
  brand: "border-brand/40 bg-brand-soft text-brand-strong",
  warning: "border-warning-border bg-warning-soft text-warning",
};

function Badge({
  variant = "status",
  className,
  children,
}: {
  variant?: keyof typeof variants;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      variant='outlined'
      className={cn(
        "me-0 inline-flex h-4.5 items-center gap-1 rounded-full px-1.5 font-mono text-[10px] leading-none tracking-wider uppercase [&_svg]:size-3",
        variants[variant],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export { Badge };
