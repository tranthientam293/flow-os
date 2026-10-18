import { useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Popover } from "antd";
import { cn } from "@/utils";
import { statusColor } from "../../constants/options";
import { useRoster } from "../../context/roster-context";
import type { Session } from "../../models/roster";
import { popupPlacement, type PopupPlacement } from "../../utils/layout";
import { formatLongDay, formatRange, inTz } from "../../utils/time";
import { SessionActions } from "./SessionActions";
import { SessionDetails } from "./SessionDetails";

// antd's popup layer; the backdrop sits just under it.
const POPUP_Z_INDEX = 1030;

interface SessionBlockProps {
  session: Session;
  style?: CSSProperties;
  compact?: boolean;
  /** My schedule: name the center instead of the trainer (always me). */
  showCenter?: boolean;
  className?: string;
}

export function SessionBlock({
  session,
  style,
  compact = false,
  showCenter = false,
  className,
}: SessionBlockProps) {
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
    <>
      {open &&
        createPortal(
          <div
            aria-hidden='true'
            className='fixed inset-0'
            style={{ zIndex: POPUP_Z_INDEX - 1 }}
            onClick={() => setOpen(false)}
          />,
          document.body,
        )}
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next && ref.current)
            setPlacement(
              popupPlacement(ref.current.getBoundingClientRect(), 290, 270),
            );
          setOpen(next);
        }}
        trigger='click'
        placement={placement}
        zIndex={POPUP_Z_INDEX}
        content={
          <div className='flex w-64 flex-col gap-3'>
            <SessionDetails session={session} />
            <SessionActions
              session={session}
              iconOnly
              onEdit={() => {
                setOpen(false);
                openBooking({ session, edit: true });
              }}
              onDone={() => setOpen(false)}
              onView={() => {
                setOpen(false);
                openBooking({ session });
              }}
            />
          </div>
        }
      >
        <button
          ref={ref}
          type='button'
          aria-label={label}
          style={{
            ...style,
            borderLeftColor: color,
            backgroundColor: `color-mix(in srgb, ${color} ${mine ? 22 : 12}%, var(--card))`,
          }}
          className={cn(
            "flex flex-col overflow-hidden rounded-sm border border-l-[3px] border-border-strong px-1.5 py-1 text-left text-[11px] leading-tight text-foreground transition-shadow focus-visible:z-50!",
            session.status === "missed" && "border-dashed",
            className,
            open && "z-50! shadow-md",
          )}
        >
          <span className='flex items-center gap-1 truncate font-medium'>
            <span className='font-mono'>{branch?.code}</span>
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
    </>
  );
}
