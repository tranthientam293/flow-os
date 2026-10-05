import { Loader2 } from "lucide-react";
import { Spin } from "antd";
import { cn } from "@/utils";

// Global Spin indicator, set on ConfigProvider so every <Spin /> matches.
function SpinnerIcon({ className }: { className?: string }) {
  return (
    <Loader2
      aria-label='Loading'
      className={cn("size-4.5 animate-spin text-muted-foreground", className)}
    />
  );
}

function CenteredSpinner({ className }: { className?: string }) {
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
