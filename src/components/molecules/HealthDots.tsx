import type { HealthStatus } from "@/types";
import { cn } from "@/utils";

export function HealthDots({ health }: { health: HealthStatus }) {
  const color =
    health.state === "healthy"
      ? "bg-brand"
      : health.state === "down"
        ? "bg-destructive"
        : "animate-pulse bg-foreground-muted";
  return (
    <div
      className='grid grid-cols-3 gap-1'
      title={health.state === "down" ? health.message : undefined}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className={cn("size-1.5 rounded-full", color)} />
      ))}
    </div>
  );
}
