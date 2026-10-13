import { useState } from "react";
import { CalendarX, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Spin } from "antd";
import { EmptyState } from "@/components/molecules";
import { cn } from "@/utils";
import { statusColor } from "../../constants/options";
import { useRoster } from "../../context/roster-context";
import { useSessions } from "../../hooks/useSessions";
import type { Session } from "../../models/roster";
import {
  addDays,
  daysFrom,
  formatLongDay,
  formatRange,
  formatWeekRange,
  inTz,
  todayIn,
  weekStartOf,
} from "../../utils/time";
import { BranchTag } from "../atoms";

export function MyWeekView() {
  const { center, meId } = useRoster();
  const today = todayIn(center.timezone);
  const [start, setStart] = useState(() =>
    weekStartOf(today, center.week_start),
  );
  const { sessions, shown, isSwitching, isLoading } = useSessions(start, 7, {
    applyFilters: false,
    memberId: meId,
    prefetchAdjacent: true,
  });
  const visible = sessions;

  const byDay = daysFrom(shown.fromDate, 7)
    .map((date) => ({
      date,
      sessions: visible.filter(
        (s) => inTz(s.starts_at, center.timezone).format("YYYY-MM-DD") === date,
      ),
    }))
    .filter((d) => d.sessions.length || d.date === today);

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4 sm:px-6'>
      <div className='flex items-center gap-2'>
        <Button
          size='small'
          icon={<ChevronLeft />}
          aria-label='Previous week'
          onClick={() => setStart((d) => addDays(d, -7))}
        />
        <Button
          size='small'
          icon={<ChevronRight />}
          aria-label='Next week'
          onClick={() => setStart((d) => addDays(d, 7))}
        />
        <span className='text-sm font-medium text-foreground'>
          {formatWeekRange(shown.fromDate)}
        </span>
        <span
          aria-hidden={!isSwitching}
          className={cn("inline-flex w-4", !isSwitching && "invisible")}
        >
          <Spin size='small' />
        </span>
      </div>

      {!isLoading && !visible.length && (
        <EmptyState
          icon={CalendarX}
          title='Nothing booked this week'
          className='min-h-40'
        />
      )}

      {visible.length > 0 &&
        byDay.map(({ date, sessions: daySessions }) => (
          <section key={date} className='flex flex-col gap-2'>
            <h3
              className={cn(
                "text-xs font-medium text-muted-foreground",
                date === today && "text-brand-strong",
              )}
            >
              {date === today ? "Today · " : ""}
              {formatLongDay(date)}
            </h3>
            {daySessions.length ? (
              daySessions.map((session) => (
                <AgendaCard key={session.id} session={session} />
              ))
            ) : (
              <p className='text-sm text-muted-foreground'>No sessions</p>
            )}
          </section>
        ))}
    </div>
  );
}

export function AgendaCard({
  session,
  showCenter = false,
}: {
  session: Session;
  showCenter?: boolean;
}) {
  const { center, branchById, openBooking } = useRoster();
  const branch = branchById.get(session.branch_id);
  return (
    <div
      className={cn(
        "rounded-md border border-l-[3px] bg-card",
        session.status === "missed" && "border-dashed",
      )}
      style={{
        borderLeftColor: statusColor(session.status),
        backgroundColor: `color-mix(in srgb, ${statusColor(session.status)} 6%, var(--card))`,
      }}
    >
      <button
        type='button'
        onClick={() => openBooking({ session })}
        className='flex w-full flex-col gap-1 px-3 py-2.5 text-left'
      >
        <span className='flex flex-wrap items-center gap-3 text-sm'>
          <span className='font-mono text-foreground'>
            {formatRange(session.starts_at, session.ends_at, center.timezone)}
          </span>
          <BranchTag branch={branch} showName />
          {showCenter && (
            <span className='text-xs text-muted-foreground'>{center.name}</span>
          )}
        </span>
        {session.title && (
          <span className='text-sm text-foreground-light'>{session.title}</span>
        )}
      </button>
    </div>
  );
}
