import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "destructive";
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-60 animate-fade-up flex-col items-center justify-center gap-3 p-6 text-center sm:p-8",
        className,
      )}
    >
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-lg border",
          tone === "destructive"
            ? "border-destructive-border bg-destructive-soft text-destructive"
            : "border-border bg-card text-foreground-light",
        )}
      >
        <Icon className='size-5' strokeWidth={1.5} />
      </div>
      <div className='space-y-1'>
        <h3 className='text-sm font-medium text-foreground'>{title}</h3>
        {description && (
          <p className='max-w-sm text-sm text-muted-foreground'>
            {description}
          </p>
        )}
      </div>
      {action && <div className='mt-1'>{action}</div>}
    </div>
  );
}
