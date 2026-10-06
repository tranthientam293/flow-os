import { useState, type CSSProperties } from "react";
import { CircleCheck } from "lucide-react";
import { Popover } from "antd";
import { cn } from "@/utils";
import { useRoster } from "../context/roster-context";
import type { Session } from "../models/roster";
import { formatLongDay, formatRange, inTz } from "../utils/time";
import { SessionDetails } from "./SessionDetails";

export function SessionBlock({
  session,
  style,
  compact = false,
  showCenter = false,
  className,
}: {
  session: Session;
  style?: CSSProperties;
  compact?: boolean;
  showCenter?: boolean;
  className?: string;
}) {
  const { center, meId, memberById, branchById } = useRoster();
  const [open, setOpen] = useState(false);
  const branch = branchById.get(session.branch_id);
  const member = memberById.get(session.member_id);
  const mine = session.member_id === meId;
  const color = branch?.color ?? "#888888";
  const time = formatRange(session.starts_at, session.ends_at, center.timezone);
  const day = formatLongDay(
    inTz(session.starts_at, center.timezone).format("YYYY-MM-DD"),
  );

  const label = [
    showCenter ? center.name : null,
    session.title,
    member?.display_name,
    branch?.code,
    `${day} ${time}`,
    session.status !== "scheduled" ? session.status : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger='click'
      placement='right'
      content={
        <SessionDetails session={session} onDone={() => setOpen(false)} />
      }
    >
      <button
        type='button'
        aria-label={label}
        style={{
          ...style,
          borderLeftColor: color,
          backgroundColor: mine
            ? `color-mix(in srgb, ${color} 18%, var(--card))`
            : "var(--card)",
        }}
        className={cn(
          "flex flex-col overflow-hidden rounded-sm border border-l-[3px] border-border-strong px-1.5 py-1 text-left text-[11px] leading-tight text-foreground transition-shadow hover:z-10 hover:shadow-md focus-visible:z-10",
          session.status === "missed" && "border-dashed",
          session.status === "cancelled" && "line-through opacity-50",
          className,
        )}
      >
        <span className='flex items-center gap-1 truncate font-medium'>
          {session.status === "completed" && (
            <CircleCheck className='size-2.5 shrink-0' aria-hidden='true' />
          )}
          <span className='font-mono'>{branch?.code}</span>
          <span className='truncate'>{member?.display_name}</span>
        </span>
        {!compact && (
          <>
            {showCenter && (
              <span className='truncate text-muted-foreground'>
                {center.name}
              </span>
            )}
            {session.title && (
              <span className='truncate text-foreground-light'>
                {session.title}
              </span>
            )}
            <span className='truncate text-muted-foreground'>{time}</span>
          </>
        )}
      </button>
    </Popover>
  );
}
