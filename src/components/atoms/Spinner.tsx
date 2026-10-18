import { Loader2 } from "lucide-react";
import { Spin } from "antd";
import { cn } from "@/utils";

interface SpinnerIconProps {
  className?: string;
}

function SpinnerIcon({ className }: SpinnerIconProps) {
  return (
    <Loader2
      aria-label='Loading'
      className={cn("size-4.5 animate-spin text-muted-foreground", className)}
    />
  );
}

interface CenteredSpinnerProps {
  className?: string;
}

function CenteredSpinner({ className }: CenteredSpinnerProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-40 items-center justify-center",
        className,
      )}
    >
      <Spin />
    </div>
  );
}

export { SpinnerIcon, CenteredSpinner };
