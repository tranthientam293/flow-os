import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
} from "lucide-react";
import { Button, Drawer, Grid, Segmented, Select, Spin } from "antd";
import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { EmptyState } from "@/components/molecules";
import { cn } from "@/utils";
import { sessionsQueryOptions } from "../../apis/sessions";
import { sectionOf, type RosterSection } from "../../constants/routes";
import {
  RosterContext,
  type BookingRequest,
} from "../../context/roster-context";
import {
  ALL_STATUSES,
  matchesStatuses,
  statusesOrAll,
} from "../../constants/options";
import { useCenterContexts } from "../../hooks/useCenterContexts";
import type { Membership, Session, SessionStatus } from "../../models/roster";
import {
  addDays,
  browserTimezone,
  dayStartIso,
  daysFrom,
  formatLongDay,
  formatMonth,
  inTz,
  openingHours,
  periodRange,
  stepPeriod,
  todayIn,
  type Period,
} from "../../utils/time";
import {
  FilterButton,
  FilterField,
  PeriodSelect,
  StatusSelect,
} from "../molecules";
import { DayLabel } from "../atoms";
import { AgendaCard } from "./MyWeekView";
import { SessionPanel } from "./SessionDrawer";
import { TimeGrid, type GridColumn } from "./TimeGrid";

type Booking = { centerId: string | null; request: BookingRequest };
type View = "calendar" | "list";

const ALL = "all";

const EMPTY_TITLE: Record<Period, string> = {
  day: "Nothing booked on this day",
  week: "Nothing booked this week",
};

export function AllCentersSchedule({
  section,
  memberships,
}: {
  section: RosterSection;
  memberships: Membership[];
}) {
  const screens = Grid.useBreakpoint();
  const phone = screens.md === false;
  const { title, description } = sectionOf(section);
  const [booking, setBooking] = useState<Booking | null>(null);
  // Calendar by week on desktop and a list of the day on phones, until the
  // user picks.
  const [pickedView, setPickedView] = useState<View | null>(null);
  const view: View = pickedView ?? (phone ? "list" : "calendar");
  const [pickedPeriod, setPeriod] = useState<Period | null>(null);
  const period: Period = pickedPeriod ?? (phone ? "day" : "week");
  const [centerFilter, setCenterFilter] = useState<string>(ALL);
  const [statuses, setStatuses] = useState<SessionStatus[]>(ALL_STATUSES);
  const shown =
    centerFilter === ALL
      ? memberships
      : memberships.filter((m) => m.center.id === centerFilter);
  const visible = shown.length ? shown : memberships;
  const { contexts } = useCenterContexts(
    section,
    memberships,
    (centerId, request) =>
      setBooking({ centerId, request: { ...request, nonce: Date.now() } }),
  );

  // One timezone for the whole grid: the centers' own when they share one.
  const zones = new Set(visible.map((m) => m.center.timezone));
  const tz =
    zones.size === 1
      ? visible[0].center.timezone
      : (browserTimezone() ?? visible[0].center.timezone);
  const today = todayIn(tz);
  const weekStart = memberships[0].center.week_start;
  // The day being looked at.
  const [anchor, setAnchor] = useState(today);
  const range = periodRange(anchor, period, weekStart);
  // A day loads its whole week, so Day and Week share one cache.
  const load =
    period === "day" ? periodRange(anchor, "week", weekStart) : range;

  const from = dayStartIso(load.start, tz);
  const to = dayStartIso(addDays(load.start, load.days), tz);
  // Only my own sessions are loaded: `m.id` is my member id at that center.
  const queries = useQueries({
    queries: visible.map((m) => ({
      ...sessionsQueryOptions(m.center.id, from, to, m.id),
      placeholderData: keepPreviousData,
    })),
  });
  const isLoading = queries.some((q) => q.isLoading);
  const isSwitching = queries.some((q) => q.isPlaceholderData);
  const sessions = queries
    .flatMap((q) => q.data ?? [])
    .filter((s) => matchesStatuses(statuses, s.status))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const hours = visible.map((m) => openingHours(m.center));
  const openMinutes = Math.min(...hours.map((h) => h.openMinutes));
  const closeMinutes = Math.max(...hours.map((h) => h.closeMinutes));
  const dateOf = (s: Session) => inTz(s.starts_at, tz).format("YYYY-MM-DD");
  const days = daysFrom(range.start, range.days);

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
      centerId: visible.length === 1 ? visible[0].center.id : null,
      request: { ...request, nonce: Date.now() },
    });

  const columns: GridColumn[] = days.map((date) => ({
    key: date,
    date,
    header: <DayLabel date={date} today={date === today} />,
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
        <div className='flex items-center gap-1'>
          <Button
            icon={<ChevronLeft />}
            aria-label={`Previous ${period}`}
            onClick={() => setAnchor((d) => stepPeriod(d, period, -1))}
          />
          <Button
            icon={<ChevronRight />}
            aria-label={`Next ${period}`}
            onClick={() => setAnchor((d) => stepPeriod(d, period, 1))}
          />
          <Button onClick={() => setAnchor(today)}>Today</Button>
        </div>
        <span className='text-sm font-medium text-foreground'>
          {period === "day" ? formatLongDay(anchor) : formatMonth(anchor)}
        </span>
        <span
          aria-hidden={!isSwitching}
          className={cn("inline-flex w-4", !isSwitching && "invisible")}
        >
          <Spin size='small' />
        </span>
        {zones.size > 1 && (
          <span className='text-sm text-muted-foreground'>Times in {tz}</span>
        )}
        <div className='ms-auto flex flex-wrap items-center gap-2'>
          <PeriodSelect value={period} onChange={setPeriod} />
          <FilterButton
            value={{ center: centerFilter, statuses }}
            empty={{ center: ALL, statuses: ALL_STATUSES }}
            count={(f) =>
              [
                f.center !== ALL,
                f.statuses.length !== ALL_STATUSES.length,
              ].filter(Boolean).length
            }
            onApply={(f) => {
              setCenterFilter(f.center);
              setStatuses(statusesOrAll(f.statuses));
            }}
          >
            {(draft, change) => (
              <>
                <FilterField label='Center'>
                  <Select
                    aria-label='Center'
                    value={draft.center}
                    onChange={(center) => change({ center })}
                    options={[
                      { value: ALL, label: "All centers" },
                      ...memberships.map((ms) => ({
                        value: ms.center.id,
                        label: ms.center.name,
                      })),
                    ]}
                  />
                </FilterField>
                <FilterField label='Status'>
                  <StatusSelect
                    value={draft.statuses}
                    onChange={(next) => change({ statuses: next })}
                  />
                </FilterField>
              </>
            )}
          </FilterButton>
          <Segmented<View>
            value={view}
            onChange={setPickedView}
            options={[
              {
                value: "calendar",
                icon: <CalendarDays aria-label='Calendar' />,
                title: "Calendar",
              },
              {
                value: "list",
                icon: <List aria-label='List' />,
                title: "List",
              },
            ]}
          />
          <Button type='primary' icon={<Plus />} onClick={() => book()}>
            Create
          </Button>
        </div>
      </div>

      {view === "list" ? (
        !isLoading &&
        !days.some((d) => sessions.some((s) => dateOf(s) === d)) ? (
          <EmptyState
            icon={CalendarX}
            title={
              statuses.length !== ALL_STATUSES.length
                ? "No sessions match the filters"
                : EMPTY_TITLE[period]
            }
            className='min-h-40'
          />
        ) : (
          days
            .map((date) => ({
              date,
              daySessions: sessions.filter((s) => dateOf(s) === date),
            }))
            .filter(
              (d) =>
                d.daySessions.length || d.date === today || period === "day",
            )
            .map(({ date, daySessions }) => (
              <section key={date} className='flex flex-col gap-2'>
                {period !== "day" && (
                  <h3
                    className={cn(
                      "text-xs font-medium text-muted-foreground",
                      date === today && "text-brand-strong",
                    )}
                  >
                    {date === today ? "Today · " : ""}
                    {formatLongDay(date)}
                  </h3>
                )}
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
            showCenter
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
      title={editing ? "Session" : "Create session"}
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
          <SessionPanel
            key={`${booking.centerId}-${booking.request.nonce}`}
            request={booking.request}
            onDone={onClose}
          />
        </RosterContext.Provider>
      )}
    </Drawer>
  );
}
