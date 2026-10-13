import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Checkbox, Select, Spin } from "antd";
import { useAppStorage } from "@/hooks";
import { cn } from "@/utils";
import { STORAGE_KEYS } from "../../constants/keys";
import { ALL_STATUSES, statusesOrAll } from "../../constants/options";
import { DEFAULT_FILTERS, useRoster } from "../../context/roster-context";
import { useSessions } from "../../hooks/useSessions";
import {
  daysFrom,
  formatLongDay,
  formatWeekRange,
  inTz,
  openingHours,
  periodRange,
  stepPeriod,
  todayIn,
  weekStartOf,
  type Period,
} from "../../utils/time";
import { isTrainer } from "../../utils/trainers";
import { BranchTag, DayLabel } from "../atoms";
import {
  FilterButton,
  FilterField,
  PeriodSelect,
  StatusSelect,
} from "../molecules";
import { TimeGrid, type GridColumn } from "./TimeGrid";

export function ScheduleView() {
  const {
    center,
    branches,
    directory,
    filters,
    setFilters,
    openBooking,
    isOwner,
    meId,
    memberBranches,
    anyBranchIds,
  } = useRoster();
  const tz = center.timezone;
  const { openMinutes, closeMinutes } = openingHours(center);
  const today = todayIn(tz);
  const [savedView, setView] = useAppStorage<Period>(
    STORAGE_KEYS.scheduleView,
    "week",
  );
  // A month view saved by an earlier version opens as a week.
  const view: Period = savedView === "day" ? "day" : "week";
  const [anchor, setAnchor] = useState(today);

  const { start, days } = periodRange(anchor, view, center.week_start);
  const { sessions, shown, isSwitching } = useSessions(start, days, {
    prefetchAdjacent: true,
    // Day and week views prefetch each other.
    prefetch: [
      view === "week"
        ? { fromDate: anchor, days: 1 }
        : { fromDate: weekStartOf(anchor, center.week_start), days: 7 },
    ],
  });
  const shownView: Period = shown.days === 1 ? "day" : "week";
  const shownStart = shown.fromDate;

  const dateOf = (iso: string) => inTz(iso, tz).format("YYYY-MM-DD");
  const activeBranches = branches.filter(
    (b) =>
      (!b.archived_at || sessions.some((s) => s.branch_id === b.id)) &&
      (isOwner ||
        anyBranchIds.has(meId) ||
        sessions.some((s) => s.branch_id === b.id) ||
        memberBranches.some(
          (mb) => mb.member_id === meId && mb.branch_id === b.id,
        )) &&
      (!filters.branchIds.length || filters.branchIds.includes(b.id)),
  );

  const columns: GridColumn[] =
    shownView === "week"
      ? daysFrom(shownStart, 7).map((date) => ({
          key: date,
          date,
          header: <DayLabel date={date} today={date === today} />,
          highlight: date === today,
          sessions: sessions.filter((s) => dateOf(s.starts_at) === date),
        }))
      : activeBranches.map((branch) => ({
          key: branch.id,
          date: shownStart,
          header: (
            <BranchTag branch={branch} showName className='justify-center' />
          ),
          sessions: sessions.filter((s) => s.branch_id === branch.id),
        }));

  const move = (direction: 1 | -1) =>
    setAnchor((d) => stepPeriod(d, view, direction));

  return (
    <div className='flex flex-col gap-3 px-4 py-4 sm:px-6'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex items-center gap-1'>
          <Button
            icon={<ChevronLeft />}
            aria-label={`Previous ${view}`}
            onClick={() => move(-1)}
          />
          <Button
            icon={<ChevronRight />}
            aria-label={`Next ${view}`}
            onClick={() => move(1)}
          />
          <Button onClick={() => setAnchor(today)}>Today</Button>
        </div>
        <span className='min-w-40 text-sm font-medium text-foreground'>
          {shownView === "week"
            ? formatWeekRange(shownStart)
            : formatLongDay(shownStart)}
        </span>
        <span
          aria-hidden={!isSwitching}
          className={cn("inline-flex w-4", !isSwitching && "invisible")}
        >
          <Spin size='small' />
        </span>
        <div className='flex items-center gap-2 sm:ms-auto'>
          <PeriodSelect value={view} onChange={setView} />
          <FilterButton
            value={filters}
            empty={DEFAULT_FILTERS}
            count={(f) =>
              [
                f.branchIds.length,
                f.statuses.length !== ALL_STATUSES.length,
                isOwner && f.memberIds.length,
                isOwner && f.onlyMe,
              ].filter(Boolean).length
            }
            onApply={(f) =>
              setFilters({ ...f, statuses: statusesOrAll(f.statuses) })
            }
          >
            {(draft, change) => (
              <>
                <FilterField label='Branch'>
                  <Select
                    mode='multiple'
                    allowClear
                    placeholder='All branches'
                    aria-label='Branch'
                    value={draft.branchIds}
                    onChange={(branchIds) => change({ branchIds })}
                    options={branches
                      .filter((b) => !b.archived_at)
                      .map((b) => ({
                        value: b.id,
                        label: `${b.code} · ${b.name}`,
                      }))}
                  />
                </FilterField>
                <FilterField label='Status'>
                  <StatusSelect
                    value={draft.statuses}
                    onChange={(statuses) => change({ statuses })}
                  />
                </FilterField>
                {isOwner && (
                  <FilterField label='Trainer'>
                    <Select
                      mode='multiple'
                      allowClear
                      placeholder='All trainers'
                      aria-label='Trainer'
                      disabled={draft.onlyMe}
                      value={draft.memberIds}
                      onChange={(memberIds) => change({ memberIds })}
                      options={directory
                        .filter((m) => isTrainer(m) && m.status !== "inactive")
                        .map((m) => ({ value: m.id, label: m.display_name }))}
                    />
                    <Checkbox
                      checked={draft.onlyMe}
                      onChange={(e) => change({ onlyMe: e.target.checked })}
                    >
                      Only me
                    </Checkbox>
                  </FilterField>
                )}
              </>
            )}
          </FilterButton>
        </div>
      </div>

      {shownView === "day" && !activeBranches.length ? (
        <p className='py-10 text-center text-sm text-muted-foreground'>
          No branches to show.
        </p>
      ) : (
        <div className='rounded-md border bg-card'>
          <TimeGrid
            columns={columns}
            timezone={tz}
            openMinutes={openMinutes}
            closeMinutes={closeMinutes}
            minColumnWidth={shownView === "week" ? 110 : 140}
            onSlotClick={(column, time) =>
              openBooking({
                date: column.date,
                branchId: shownView === "day" ? column.key : undefined,
                start: time,
              })
            }
          />
        </div>
      )}
    </div>
  );
}
