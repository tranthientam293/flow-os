import { useState } from "react";
import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { Pencil, Wallet } from "lucide-react";
import { Button, DatePicker, Modal, Spin, Table } from "antd";
import { MONTH_FORMAT } from "@/constants";
import { EmptyState } from "@/components/molecules";
import { dayjs } from "@/libs";
import { cn } from "@/utils";
import { branchesQueryOptions } from "../../apis/branches";
import { incomeQueryOptions } from "../../apis/income";
import type { RosterSection } from "../../constants/routes";
import { useCheckout } from "../../context/checkout-context";
import { useCenterContexts } from "../../hooks/useCenterContexts";
import type {
  Branch,
  Membership,
  Session,
  SessionFee,
} from "../../models/roster";
import { formatAmount, formatNumber } from "../../utils/money";
import { sessionAccess } from "../../utils/permissions";
import {
  dayStartIso,
  durationHours,
  formatLongDay,
  formatRange,
  inTz,
  monthBounds,
  todayIn,
} from "../../utils/time";

// One completed session with its pay.
type Line = {
  session: Session;
  center: string;
  branch: Branch | undefined;
  // The center's timezone, for the session's date and time.
  tz: string;
  hours: number;
  salary: number;
  fees: number;
  // The fees one by one, for the pay modal.
  feeItems: SessionFee[];
  total: number;
};

const formatHours = (hours: number) => `${formatNumber(hours)} h`;

// My schedule → Income: your completed sessions in one month, with their
// salary and fees and the month's total. Only your own sessions, also at
// centers you own.
export function IncomeView({
  section,
  memberships,
}: {
  section: RosterSection;
  memberships: Membership[];
}) {
  // Each center's context, for the checkout (fees) and its permissions.
  const { contexts } = useCenterContexts(section, memberships, () => {});
  const { openCheckout } = useCheckout();
  // The session whose pay is shown in the modal.
  const [viewing, setViewing] = useState<Line | null>(null);
  const tz = memberships[0].center.timezone;
  const thisMonth = monthBounds(todayIn(tz)).first;
  const [month, setMonth] = useState(thisMonth);

  const queries = useQueries({
    queries: memberships.map((m) => {
      const { first } = monthBounds(month);
      const next = dayjs(first).add(1, "month").format("YYYY-MM-DD");
      return {
        ...incomeQueryOptions(
          m.center.id,
          // My member id at that center: only my sessions.
          m.id,
          dayStartIso(first, m.center.timezone),
          dayStartIso(next, m.center.timezone),
        ),
        placeholderData: keepPreviousData,
      };
    }),
  });
  const branches = useQueries({
    queries: memberships.map((m) => branchesQueryOptions(m.center.id)),
  });
  const branchById = new Map(
    branches.flatMap((q) => q.data ?? []).map((b) => [b.id, b]),
  );
  const isLoading = queries.some((q) => q.isLoading);
  const isSwitching = queries.some((q) => q.isPlaceholderData);

  const lines: Line[] = memberships
    .flatMap((m, i) => {
      const data = queries[i].data;
      if (!data) return [];
      const feesBySession = new Map<string, SessionFee[]>();
      for (const fee of data.fees)
        feesBySession.set(fee.session_id, [
          ...(feesBySession.get(fee.session_id) ?? []),
          fee,
        ]);
      return data.sessions.map((session) => {
        const salary = Number(session.salary ?? 0);
        const feeItems = feesBySession.get(session.id) ?? [];
        const fees = feeItems.reduce((n, f) => n + Number(f.amount), 0);
        return {
          session,
          center: m.center.name,
          branch: branchById.get(session.branch_id),
          tz: m.center.timezone,
          hours: durationHours(session.starts_at, session.ends_at),
          salary,
          fees,
          feeItems,
          total: salary + fees,
        };
      });
    })
    .sort((a, b) => a.session.starts_at.localeCompare(b.session.starts_at));

  const totals = {
    hours: lines.reduce((n, l) => n + l.hours, 0),
    salary: lines.reduce((n, l) => n + l.salary, 0),
    fees: lines.reduce((n, l) => n + l.fees, 0),
    total: lines.reduce((n, l) => n + l.total, 0),
  };

  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6'>
      <div>
        <h2 className='text-base font-medium text-foreground'>Income</h2>
        <p className='text-sm text-muted-foreground'>
          Your completed sessions in the month, with their salary and fees.
        </p>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <DatePicker
          picker='month'
          aria-label='Month'
          format={MONTH_FORMAT}
          allowClear={false}
          value={dayjs(month)}
          // Months after this one have no completed sessions yet.
          disabledDate={(d) =>
            d.startOf("month").format("YYYY-MM-DD") > thisMonth
          }
          onChange={(d) =>
            d && setMonth(d.startOf("month").format("YYYY-MM-DD"))
          }
        />
        <span
          aria-hidden={!isSwitching}
          className={cn("inline-flex w-4", !isSwitching && "invisible")}
        >
          <Spin size='small' />
        </span>
      </div>

      {isLoading ? (
        <Spin className='py-16' />
      ) : !lines.length ? (
        <EmptyState
          icon={Wallet}
          title='No completed sessions this month'
          description='Sessions show up here once they are completed.'
          className='min-h-40'
        />
      ) : (
        <>
          {/* The month's totals. */}
          <section
            aria-label='Month total'
            className='grid grid-cols-2 gap-2 sm:grid-cols-5'
          >
            <Stat label='Sessions' value={String(lines.length)} />
            <Stat label='Hours' value={formatHours(totals.hours)} />
            <Stat label='Salary' value={formatAmount(totals.salary)} />
            <Stat label='Fees' value={formatAmount(totals.fees)} />
            <Stat label='Total' value={formatAmount(totals.total)} strong />
          </section>
          <div className='rounded-md border bg-card'>
            <Table<Line>
              rowKey={(l) => l.session.id}
              size='middle'
              pagination={false}
              scroll={{ x: "max-content" }}
              dataSource={lines}
              // Clicking a row shows its pay.
              onRow={(l) => ({ onClick: () => setViewing(l) })}
              rowClassName='cursor-pointer'
              columns={[
                {
                  title: "#",
                  align: "right",
                  width: 48,
                  render: (_, _l, index) => (
                    <span className='text-muted-foreground'>{index + 1}</span>
                  ),
                },
                {
                  title: "Date",
                  render: (_, l) =>
                    formatLongDay(
                      inTz(l.session.starts_at, l.tz).format("YYYY-MM-DD"),
                    ),
                },
                {
                  title: "Time",
                  render: (_, l) =>
                    formatRange(l.session.starts_at, l.session.ends_at, l.tz),
                },
                { title: "Center", dataIndex: "center" },
                {
                  title: "Branch",
                  render: (_, l) => l.branch?.name ?? "—",
                },
                {
                  title: "Session",
                  render: (_, l) => l.session.title || "—",
                },
                {
                  title: "Hours",
                  dataIndex: "hours",
                  align: "right",
                  render: formatHours,
                },
                {
                  title: "Salary",
                  dataIndex: "salary",
                  align: "right",
                  render: formatAmount,
                },
                {
                  title: "Fees",
                  dataIndex: "fees",
                  align: "right",
                  render: formatAmount,
                },
                {
                  title: "Total",
                  dataIndex: "total",
                  align: "right",
                  render: (v: number) => (
                    <span className='font-medium text-foreground'>
                      {formatAmount(v)}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  render: (_, l) => {
                    // Fees can change while the session is in the current month.
                    const ctx = contexts.get(l.session.center_id);
                    const canEdit =
                      !!ctx && sessionAccess(l.session, ctx).canEdit;
                    return (
                      <div className='flex justify-end'>
                        {canEdit && ctx && (
                          <Button
                            type='text'
                            size='small'
                            icon={<Pencil />}
                            title='Edit fees'
                            aria-label='Edit fees'
                            onClick={(e) => {
                              // Don't also open the row's pay.
                              e.stopPropagation();
                              openCheckout(l.session, ctx);
                            }}
                          />
                        )}
                      </div>
                    );
                  },
                },
              ]}
            />
          </div>
        </>
      )}

      <Modal
        open={!!viewing}
        title={viewing ? `Pay · ${viewing.session.title || "Session"}` : "Pay"}
        onCancel={() => setViewing(null)}
        footer={null}
        width={400}
      >
        {viewing && (
          <div className='flex flex-col gap-3'>
            <p className='text-sm text-muted-foreground'>
              {formatLongDay(
                inTz(viewing.session.starts_at, viewing.tz).format(
                  "YYYY-MM-DD",
                ),
              )}{" "}
              ·{" "}
              {formatRange(
                viewing.session.starts_at,
                viewing.session.ends_at,
                viewing.tz,
              )}{" "}
              · {viewing.center}
            </p>
            <PayList line={viewing} />
          </div>
        )}
      </Modal>
    </div>
  );
}

// A session's pay in the modal: salary, each fee, and the total.
function PayList({ line }: { line: Line }) {
  return (
    <ul className='flex flex-col gap-1.5 text-sm'>
      <li className='flex justify-between gap-4'>
        <span className='text-foreground-light'>Salary</span>
        <span className='text-foreground'>{formatAmount(line.salary)}</span>
      </li>
      <li className='pt-1.5 text-xs font-medium text-muted-foreground'>Fees</li>
      {line.feeItems.length ? (
        line.feeItems.map((fee) => (
          <li key={fee.id} className='flex justify-between gap-4'>
            <span className='text-foreground-light'>{fee.label}</span>
            <span className='text-foreground'>
              {formatAmount(Number(fee.amount))}
            </span>
          </li>
        ))
      ) : (
        <li className='text-muted-foreground'>No fees</li>
      )}
      <li className='mt-1 flex justify-between gap-4 border-t pt-1.5 font-medium'>
        <span className='text-foreground'>Total</span>
        <span className='text-foreground'>{formatAmount(line.total)}</span>
      </li>
    </ul>
  );
}

// One total in the month summary.
function Stat({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-md border bg-card px-3 py-2.5",
        // The total spans the row on phones.
        strong && "col-span-2 border-brand/40 bg-brand/5 sm:col-span-1",
      )}
    >
      <span className='text-xs text-muted-foreground'>{label}</span>
      <span
        className={cn(
          "text-base font-medium text-foreground tabular-nums",
          strong && "text-brand-strong",
        )}
      >
        {value}
      </span>
    </div>
  );
}
