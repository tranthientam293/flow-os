import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Checkbox, Segmented, Select, Spin } from "antd";
import { useAppStorage } from "@/hooks";
import { cn } from "@/utils";
import { STORAGE_KEYS } from "../../constants/keys";
import { useRoster } from "../../context/roster-context";
import { useSessions } from "../../hooks/useSessions";
import {
  addDays,
  daysFrom,
  formatDay,
  formatLongDay,
  formatWeekRange,
  inTz,
  openingHours,
  todayIn,
  weekStartOf,
} from "../../utils/time";
import { isTrainer } from "../../utils/trainers";
import { BranchTag } from "../atoms";
import { TimeGrid, type GridColumn } from "./TimeGrid";

type View = "week" | "day";

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
  const [view, setView] = useAppStorage<View>(
    STORAGE_KEYS.scheduleView,
    "week",
  );
  const [anchor, setAnchor] = useState(today);

  const start =
    view === "week" ? weekStartOf(anchor, center.week_start) : anchor;
  const days = view === "week" ? 7 : 1;
  const { sessions, shown, isSwitching } = useSessions(start, days, {
    prefetchAdjacent: true,
    prefetch: [
      view === "week"
        ? { fromDate: anchor, days: 1 }
        : { fromDate: weekStartOf(anchor, center.week_start), days: 7 },
    ],
  });
  const shownView: View = shown.days === 1 ? "day" : "week";
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
          header: formatDay(date),
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
    setAnchor((d) => addDays(d, direction * days));

  return (
    <div className='flex flex-col gap-3 px-4 py-4 sm:px-6'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex items-center gap-1'>
          <Button
            size='small'
            icon={<ChevronLeft />}
            aria-label='Previous'
            onClick={() => move(-1)}
          />
          <Button
            size='small'
            icon={<ChevronRight />}
            aria-label='Next'
            onClick={() => move(1)}
          />
          <Button size='small' onClick={() => setAnchor(today)}>
            Today
          </Button>
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
        <Segmented<View>
          size='small'
          value={view}
          onChange={setView}
          options={[
            { value: "week", label: "Week" },
            { value: "day", label: "Day" },
          ]}
        />
        <div className='flex flex-wrap items-center gap-2 sm:ms-auto'>
          <Select
            mode='multiple'
            size='small'
            allowClear
            maxTagCount='responsive'
            placeholder='Branch'
            aria-label='Branch'
            className='min-w-32'
            value={filters.branchIds}
            onChange={(branchIds) => setFilters({ ...filters, branchIds })}
            options={branches
              .filter((b) => !b.archived_at)
              .map((b) => ({ value: b.id, label: `${b.code} · ${b.name}` }))}
          />
          {isOwner && (
            <>
              <Select
                mode='multiple'
                size='small'
                allowClear
                maxTagCount='responsive'
                placeholder='Trainer'
                aria-label='Trainer'
                className='min-w-32'
                value={filters.memberIds}
                onChange={(memberIds) => setFilters({ ...filters, memberIds })}
                options={directory
                  .filter((m) => isTrainer(m) && m.status !== "inactive")
                  .map((m) => ({ value: m.id, label: m.display_name }))}
              />
              <Checkbox
                checked={filters.onlyMe}
                onChange={(e) =>
                  setFilters({ ...filters, onlyMe: e.target.checked })
                }
              >
                Only me
              </Checkbox>
            </>
          )}
          <Checkbox
            checked={filters.showCancelled}
            onChange={(e) =>
              setFilters({ ...filters, showCancelled: e.target.checked })
            }
          >
            Show cancelled
          </Checkbox>
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
