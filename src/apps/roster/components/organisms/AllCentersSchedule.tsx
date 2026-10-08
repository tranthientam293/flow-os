import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings2,
} from "lucide-react";
import { Button, Drawer, Grid, Select, Spin } from "antd";
import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { EmptyState } from "@/components/molecules";
import { cn } from "@/utils";
import { sessionsQueryOptions } from "../../apis/sessions";
import { sectionOf, type RosterSection } from "../../constants/routes";
import {
  RosterContext,
  type BookingRequest,
} from "../../context/roster-context";
import { useCenterContexts } from "../../hooks/useCenterContexts";
import { useRosterPaths } from "../../hooks/useRosterPaths";
import type { Membership, Session } from "../../models/roster";
import {
  addDays,
  browserTimezone,
  dayStartIso,
  daysFrom,
  formatDay,
  formatLongDay,
  formatWeekRange,
  inTz,
  openingHours,
  todayIn,
  weekStartOf,
} from "../../utils/time";
import { AgendaCard } from "./MyWeekView";
import { SessionForm } from "./SessionDrawer";
import { TimeGrid, type GridColumn } from "./TimeGrid";

type Booking = { centerId: string | null; request: BookingRequest };

export function AllCentersSchedule({
  section,
  memberships,
}: {
  section: RosterSection;
  memberships: Membership[];
}) {
  const screens = Grid.useBreakpoint();
  const paths = useRosterPaths();
  const { tabs, title, description } = sectionOf(section);
  const [booking, setBooking] = useState<Booking | null>(null);
  const { contexts } = useCenterContexts(
    section,
    memberships,
    (centerId, request) =>
      setBooking({ centerId, request: { ...request, nonce: Date.now() } }),
  );

  // One timezone for the whole grid: the centers' own when they share one.
  const zones = new Set(memberships.map((m) => m.center.timezone));
  const tz =
    zones.size === 1
      ? memberships[0].center.timezone
      : (browserTimezone() ?? memberships[0].center.timezone);
  const today = todayIn(tz);
  const [start, setStart] = useState(() =>
    weekStartOf(today, memberships[0].center.week_start),
  );

  const from = dayStartIso(start, tz);
  const to = dayStartIso(addDays(start, 7), tz);
  const queries = useQueries({
    queries: memberships.map((m) => ({
      ...sessionsQueryOptions(m.center.id, from, to),
      placeholderData: keepPreviousData,
    })),
  });
  const isLoading = queries.some((q) => q.isLoading);
  const isSwitching = queries.some((q) => q.isPlaceholderData);
  const sessions = queries
    .flatMap((q) => q.data ?? [])
    .filter(
      (s) =>
        s.status !== "cancelled" &&
        (section === "centers" ||
          s.member_id === contexts.get(s.center_id)?.meId),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const hours = memberships.map((m) => openingHours(m.center));
  const openMinutes = Math.min(...hours.map((h) => h.openMinutes));
  const closeMinutes = Math.max(...hours.map((h) => h.closeMinutes));
  const dateOf = (s: Session) => inTz(s.starts_at, tz).format("YYYY-MM-DD");
  const days = daysFrom(start, 7);

  const inContext = (session: Session, node: ReactNode) => {
    const ctx = contexts.get(session.center_id);
    return ctx ? (
      <RosterContext.Provider key={session.id} value={ctx}>
        {node}
      </RosterContext.Provider>
    ) : null;
  };

  const book = (request: BookingRequest = {}) =>
    setBooking({
      centerId: memberships.length === 1 ? memberships[0].center.id : null,
      request: { ...request, nonce: Date.now() },
    });

  const columns: GridColumn[] = days.map((date) => ({
    key: date,
    date,
    header: formatDay(date),
    highlight: date === today,
    sessions: sessions.filter((s) => dateOf(s) === date),
  }));

  return (
    <div className='flex flex-col gap-4 px-4 py-4 sm:px-6'>
      <div>
        <h2 className='text-base font-medium text-foreground'>{title}</h2>
        <p className='text-sm text-muted-foreground'>{description}</p>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        {memberships.map((m) => (
          <Link
            key={m.id}
            to={paths.center(section, m.center.id, tabs[0].key)}
            className='flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-sm text-foreground-light transition-colors hover:border-border-strong hover:text-foreground'
          >
            {m.center.name}
            <Settings2 className='size-3.5 text-muted-foreground' />
          </Link>
        ))}
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex items-center gap-1'>
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
          <Button
            size='small'
            onClick={() =>
              setStart(weekStartOf(today, memberships[0].center.week_start))
            }
          >
            Today
          </Button>
        </div>
        <span className='text-sm font-medium text-foreground'>
          {formatWeekRange(start)}
        </span>
        <span
          aria-hidden={!isSwitching}
          className={cn("inline-flex w-4", !isSwitching && "invisible")}
        >
          <Spin size='small' />
        </span>
        {zones.size > 1 && (
          <span className='text-xs text-muted-foreground'>Times in {tz}</span>
        )}
        <Button
          type='primary'
          size='small'
          icon={<Plus />}
          className='ms-auto'
          onClick={() => book()}
        >
          Book session
        </Button>
      </div>

      {screens.md === false ? (
        !isLoading && !sessions.length ? (
          <EmptyState
            icon={CalendarX}
            title='Nothing booked this week'
            className='min-h-40'
          />
        ) : (
          days
            .map((date) => ({
              date,
              daySessions: sessions.filter((s) => dateOf(s) === date),
            }))
            .filter((d) => d.daySessions.length || d.date === today)
            .map(({ date, daySessions }) => (
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
                  daySessions.map((s) =>
                    inContext(s, <AgendaCard session={s} showCenter />),
                  )
                ) : (
                  <p className='text-sm text-muted-foreground'>No sessions</p>
                )}
              </section>
            ))
        )
      ) : (
        <div className='rounded-md border bg-card'>
          <TimeGrid
            columns={columns}
            timezone={tz}
            openMinutes={openMinutes}
            closeMinutes={closeMinutes}
            showCenter={memberships.length > 1}
            wrapSession={inContext}
            onSlotClick={(column, time) =>
              book({ date: column.date, start: time })
            }
          />
        </div>
      )}

      <BookingDrawer
        booking={booking}
        memberships={memberships}
        contexts={contexts}
        onChangeCenter={(centerId) =>
          setBooking((b) => (b ? { ...b, centerId } : b))
        }
        onClose={() => setBooking(null)}
      />
    </div>
  );
}

function BookingDrawer({
  booking,
  memberships,
  contexts,
  onChangeCenter,
  onClose,
}: {
  booking: Booking | null;
  memberships: Membership[];
  contexts: ReturnType<typeof useCenterContexts>["contexts"];
  onChangeCenter: (centerId: string) => void;
  onClose: () => void;
}) {
  const screens = Grid.useBreakpoint();
  const ctx = booking?.centerId ? contexts.get(booking.centerId) : undefined;
  const editing = !!booking?.request.session;

  return (
    <Drawer
      open={!!booking}
      onClose={onClose}
      title={editing ? "Session" : "Book session"}
      placement={screens.md === false ? "bottom" : "right"}
      size={screens.md === false ? "85%" : 440}
      destroyOnHidden
    >
      {booking && !editing && memberships.length > 1 && (
        <div className='mb-4'>
          <div className='mb-1.5 text-sm text-foreground'>Center</div>
          <Select
            className='w-full'
            placeholder='Choose a center'
            value={booking.centerId ?? undefined}
            onChange={onChangeCenter}
            options={memberships.map((m) => ({
              value: m.center.id,
              label: m.center.name,
            }))}
          />
        </div>
      )}
      {booking && ctx && (
        <RosterContext.Provider value={ctx}>
          <SessionForm
            key={`${booking.centerId}-${booking.request.nonce}`}
            request={booking.request}
            onDone={onClose}
          />
        </RosterContext.Provider>
      )}
    </Drawer>
  );
}
