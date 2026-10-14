import { CalendarDays, Repeat, Wallet } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { cn } from "@/utils";
import type { RosterSection } from "../../constants/routes";
import { repeatsQueryOptions } from "../../apis/repeats";
import { useRosterPaths } from "../../hooks/useRosterPaths";
import type { Membership } from "../../models/roster";
import { AllCentersSchedule } from "./AllCentersSchedule";
import { IncomeView } from "./IncomeView";
import { MyRepeatsView } from "./RepeatsView";

export type WorkView = "schedule" | "income" | "repeats";

const TABS = [
  { key: "schedule", label: "Schedule", icon: CalendarDays },
  { key: "income", label: "Income", icon: Wallet },
  // Shown only while you have active repeats (or it's open).
  { key: "repeats", label: "Repeats", icon: Repeat },
] as const;

// My schedule across all centers, with tabs like a center's in Manage centers.
export function WorkShell({
  section,
  view,
  memberships,
}: {
  section: RosterSection;
  view: WorkView;
  memberships: Membership[];
}) {
  const navigate = useNavigate();
  const paths = useRosterPaths();
  const repeats = useQueries({
    queries: memberships.map((m) => repeatsQueryOptions(m.center.id)),
  });
  const hasRepeats = repeats.some((q, i) =>
    (q.data ?? []).some((r) => r.member_id === memberships[i].id),
  );
  const tabs = TABS.filter(
    (t) => t.key !== "repeats" || view === "repeats" || hasRepeats,
  );

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex h-11 shrink-0 items-stretch border-b px-2 sm:px-4'>
        <nav
          aria-label='My schedule sections'
          className='flex min-w-0 flex-1 [scrollbar-width:none] items-stretch gap-1 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden'
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              type='button'
              aria-current={view === t.key ? "page" : undefined}
              onClick={() =>
                navigate(
                  t.key === "income"
                    ? paths.income
                    : t.key === "repeats"
                      ? paths.repeats
                      : paths.section(section),
                )
              }
              className={cn(
                "flex shrink-0 items-center gap-1.5 px-3 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                view === t.key &&
                  "text-foreground shadow-[inset_0_-2px_0_var(--foreground)]",
              )}
            >
              <t.icon className='size-4 shrink-0' strokeWidth={1.75} />
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div className='min-h-0 flex-1'>
        {view === "repeats" ? (
          <MyRepeatsView section={section} memberships={memberships} />
        ) : view === "income" ? (
          <IncomeView section={section} memberships={memberships} />
        ) : (
          <AllCentersSchedule section={section} memberships={memberships} />
        )}
      </div>
    </div>
  );
}
