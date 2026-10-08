import { useRef, useState, type CSSProperties } from "react";
import { Popover } from "antd";
import { cn } from "@/utils";
import { statusColor } from "../../constants/options";
import { useRoster } from "../../context/roster-context";
import type { Session } from "../../models/roster";
import { popupPlacement, type PopupPlacement } from "../../utils/layout";
import { formatLongDay, formatRange, inTz } from "../../utils/time";
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
  // My schedule: name the center instead of the trainer (always me).
  showCenter?: boolean;
  className?: string;
}) {
  const { center, meId, memberById, branchById, openBooking } = useRoster();
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<PopupPlacement>("right");
  const ref = useRef<HTMLButtonElement>(null);
  const branch = branchById.get(session.branch_id);
  const member = memberById.get(session.member_id);
  const mine = session.member_id === meId;
  const color = statusColor(session.status);
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
      onOpenChange={(next) => {
        // Open on the side with room, so the card stays on screen.
        if (next && ref.current)
          setPlacement(
            popupPlacement(ref.current.getBoundingClientRect(), 290, 220),
          );
        setOpen(next);
      }}
      // Hover shows the details; clicking opens the drawer with the actions.
      trigger='hover'
      mouseEnterDelay={0.25}
      placement={placement}
      content={<SessionDetails session={session} />}
    >
      <button
        ref={ref}
        type='button'
        aria-label={label}
        onClick={() => {
          setOpen(false);
          openBooking({ session });
        }}
        style={{
          ...style,
          borderLeftColor: color,
          // My own sessions get a stronger tint.
          backgroundColor: `color-mix(in srgb, ${color} ${mine ? 22 : 12}%, var(--card))`,
        }}
        className={cn(
          "flex flex-col overflow-hidden rounded-sm border border-l-[3px] border-border-strong px-1.5 py-1 text-left text-[11px] leading-tight text-foreground transition-shadow hover:z-50! hover:shadow-md focus-visible:z-50!",
          session.status === "missed" && "border-dashed",
          className,
          // The hovered block comes to the front, even when stacked under others.
          open && "z-50! shadow-md",
        )}
      >
        <span className='flex items-center gap-1 truncate font-medium'>
          <span className='font-mono'>{branch?.code}</span>
          {/* My schedule (all mine): the center. A center schedule: the trainer. */}
          <span className='truncate'>
            {showCenter ? center.name : member?.display_name}
          </span>
        </span>
        {!compact && (
          <>
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
