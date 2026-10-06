import type { ReactNode } from "react";
import { cn } from "@/utils";
import { HOUR_HEIGHT_PX } from "../constants/options";
import type { Session } from "../models/roster";
import { layoutOverlaps } from "../utils/layout";
import { inTz, minutesOfDay, minutesToTime } from "../utils/time";
import { SessionBlock } from "./SessionBlock";

export type GridColumn = {
  key: string;
  header: ReactNode;
  date: string;
  sessions: Session[];
  highlight?: boolean;
};

export function TimeGrid({
  columns,
  timezone: tz,
  openMinutes,
  closeMinutes,
  onSlotClick,
  minColumnWidth = 110,
  showCenter = false,
  wrapSession = (_session, block) => block,
}: {
  columns: GridColumn[];
  timezone: string;
  openMinutes: number;
  closeMinutes: number;
  onSlotClick?: (column: GridColumn, time: string) => void;
  minColumnWidth?: number;
  showCenter?: boolean;
  // Lets a multi-center view give each block its own center context.
  wrapSession?: (session: Session, block: ReactNode) => ReactNode;
}) {
  const all = columns.flatMap((c) => c.sessions);
  const startHour = Math.min(
    Math.floor(openMinutes / 60),
    ...all.map((s) => Math.floor(minutesOfDay(s.starts_at, tz) / 60)),
  );
  const endHour = Math.max(
    Math.ceil(closeMinutes / 60),
    ...all.map((s) => {
      const sameDay =
        inTz(s.ends_at, tz).format("YYYY-MM-DD") ===
        inTz(s.starts_at, tz).format("YYYY-MM-DD");
      return sameDay ? Math.ceil(minutesOfDay(s.ends_at, tz) / 60) : 24;
    }),
  );
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  );
  const height = hours.length * HOUR_HEIGHT_PX;
  const pxPerMinute = HOUR_HEIGHT_PX / 60;

  return (
    <div className='overflow-x-auto'>
      <div
        className='grid'
        style={{
          gridTemplateColumns: `3rem repeat(${columns.length}, minmax(${minColumnWidth}px, 1fr))`,
          minWidth: 48 + columns.length * minColumnWidth,
        }}
      >
        <div className='sticky top-0 z-20 border-b bg-background' />
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              "sticky top-0 z-20 truncate border-b border-l bg-background px-2 py-2 text-center text-xs text-foreground-light",
              column.highlight && "font-medium text-brand-strong",
            )}
          >
            {column.header}
          </div>
        ))}

        <div className='relative' style={{ height }}>
          {hours.map((hour, i) => (
            <div
              key={hour}
              className='absolute right-1.5 -translate-y-1/2 font-mono text-[10px] text-muted-foreground'
              style={{ top: i * HOUR_HEIGHT_PX }}
            >
              {i > 0 && `${String(hour).padStart(2, "0")}:00`}
            </div>
          ))}
        </div>

        {columns.map((column) => {
          const intervals = column.sessions.map((s) => {
            const start = Math.max(
              0,
              minutesOfDay(s.starts_at, tz) - startHour * 60,
            );
            const sameDay =
              inTz(s.ends_at, tz).format("YYYY-MM-DD") === column.date;
            const end = sameDay
              ? minutesOfDay(s.ends_at, tz) - startHour * 60
              : (endHour - startHour) * 60;
            return { id: s.id, start, end: Math.max(end, start + 15) };
          });
          const placement = layoutOverlaps(intervals);
          return (
            <div
              key={column.key}
              className={cn(
                "relative border-l",
                column.highlight && "bg-brand-soft/30",
              )}
              style={{ height }}
            >
              <div
                aria-hidden='true'
                className='pointer-events-none absolute inset-x-0 top-0 bg-surface-muted'
                style={{ height: (openMinutes - startHour * 60) * pxPerMinute }}
              />
              <div
                aria-hidden='true'
                className='pointer-events-none absolute inset-x-0 bottom-0 bg-surface-muted'
                style={{ top: (closeMinutes - startHour * 60) * pxPerMinute }}
              />
              {hours.map((hour, i) => {
                const slotStart = Math.max(hour * 60, openMinutes);
                const isOpen =
                  slotStart < closeMinutes && slotStart < (hour + 1) * 60;
                const style = {
                  top: i * HOUR_HEIGHT_PX,
                  height: HOUR_HEIGHT_PX,
                };
                return isOpen ? (
                  <button
                    key={hour}
                    type='button'
                    tabIndex={-1}
                    aria-hidden='true'
                    onClick={() =>
                      onSlotClick?.(column, minutesToTime(slotStart))
                    }
                    className='absolute inset-x-0 border-t border-border/70 hover:bg-surface-muted'
                    style={style}
                  />
                ) : (
                  <div
                    key={hour}
                    aria-hidden='true'
                    className='pointer-events-none absolute inset-x-0 border-t border-border/70'
                    style={style}
                  />
                );
              })}
              {column.sessions.map((session) => {
                const interval = intervals.find((i) => i.id === session.id) ?? {
                  start: 0,
                  end: 15,
                };
                const place = placement.get(session.id) ?? {
                  column: 0,
                  columns: 1,
                };
                const width = 100 / place.columns;
                const blockHeight =
                  (interval.end - interval.start) * pxPerMinute;
                return wrapSession(
                  session,
                  <SessionBlock
                    key={session.id}
                    session={session}
                    showCenter={showCenter}
                    compact={blockHeight < 40}
                    className='absolute'
                    style={{
                      top: interval.start * pxPerMinute + 1,
                      height: blockHeight - 2,
                      left: `calc(${place.column * width}% + 2px)`,
                      width: `calc(${width}% - 4px)`,
                    }}
                  />,
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
