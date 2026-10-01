import type * as React from "react";
import { cn } from "@/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot='kbd'
      className={cn(
        "rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] leading-none text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
