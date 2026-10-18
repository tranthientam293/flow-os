import { Badge } from "@/components/atoms";
import { cn } from "@/utils";

const STATUS = {
  completed: { label: "Completed", variant: "brand" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  missed: { label: "Missed", variant: "warning" },
} as const;

interface SessionStatusBadgeProps {
  status: string;
  /** Smaller, for schedule blocks. */
  compact?: boolean;
  className?: string;
}

export function SessionStatusBadge({
  status,
  compact = false,
  className,
}: SessionStatusBadgeProps) {
  const info = STATUS[status as keyof typeof STATUS];
  if (!info) return null;
  return (
    <Badge
      variant={info.variant}
      className={cn(
        compact && "h-3.5 px-1 text-[8px] tracking-normal",
        className,
      )}
    >
      {info.label}
    </Badge>
  );
}
