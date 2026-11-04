import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/utils";
import type { FundTransactionKind } from "../../models/ledger";

interface FundKindIconProps {
  kind: FundTransactionKind;
  className?: string;
}

// Money in (arrow into the fund, brand green) or out (arrow out, red).
export function FundKindIcon({ kind, className }: FundKindIconProps) {
  const Icon = kind === "contribute" ? ArrowDownLeft : ArrowUpRight;
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        kind === "contribute"
          ? "bg-brand-soft text-brand-strong"
          : "bg-destructive-soft text-destructive",
        className,
      )}
    >
      <Icon className='size-4.5' />
    </span>
  );
}
