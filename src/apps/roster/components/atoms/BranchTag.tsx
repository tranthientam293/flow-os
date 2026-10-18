import { cn } from "@/utils";
import type { Branch } from "../../models/roster";

interface BranchTagProps {
  branch: Pick<Branch, "code" | "name" | "color"> | undefined;
  showName?: boolean;
  className?: string;
}

export function BranchTag({
  branch,
  showName = false,
  className,
}: BranchTagProps) {
  if (!branch) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-foreground-light",
        className,
      )}
    >
      <span
        aria-hidden='true'
        className='size-2 shrink-0 rounded-full'
        style={{ backgroundColor: branch.color }}
      />
      <span className='font-mono font-medium text-foreground'>
        {branch.code}
      </span>
      {showName && <span className='truncate'>{branch.name}</span>}
    </span>
  );
}
