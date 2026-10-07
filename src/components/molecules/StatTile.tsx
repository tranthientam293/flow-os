import type { MouseEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";

type StatTileProps = {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  iconSlot?: ReactNode;
  to?: string;
  onClick?: (event: MouseEvent) => void;
};

export function StatTile({
  label,
  value,
  icon: Icon,
  iconSlot,
  to,
  onClick,
}: StatTileProps) {
  const body = (
    <>
      <div className='flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground-light transition-colors group-hover:border-border-strong sm:size-16'>
        {iconSlot ??
          (Icon && <Icon className='size-4.5' strokeWidth={1.5} />)}
      </div>
      <div className='min-w-0'>
        <div className='eyebrow'>{label}</div>
        <div className='mt-1 truncate text-base text-foreground-light group-hover:text-foreground'>
          {value}
        </div>
      </div>
    </>
  );

  const className = "group flex items-center gap-4 rounded-lg";
  return to ? (
    <Link to={to} onClick={onClick} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
