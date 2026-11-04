import { memo, useMemo } from "react";
import dayjs from "dayjs";
import { History, Pencil, Trash2 } from "lucide-react";
import { Button } from "antd";
import { DAY_FORMAT } from "@/constants";
import { cn } from "@/utils";
import type { FundMember, FundTransaction } from "../../models/ledger";
import { formatSigned, memberName, signedAmount } from "../../utils/funds";
import { FundKindIcon } from "../atoms";

interface FundTransactionListProps {
  transactions: FundTransaction[];
  members: Map<string, FundMember>;
  // Pass stable callbacks (useCallback): the list and its rows are memoized,
  // so they only re-render when their own data changes.
  canEdit: (transaction: FundTransaction) => boolean;
  onEdit: (transaction: FundTransaction) => void;
  onDelete: (transaction: FundTransaction) => void;
  onHistory: (transaction: FundTransaction) => void;
}

// Transactions grouped by day, newest first, each day with its net change.
// A row shows the note, who recorded it and the amount.
export const FundTransactionList = memo(function FundTransactionList({
  transactions,
  members,
  canEdit,
  onEdit,
  onDelete,
  onHistory,
}: FundTransactionListProps) {
  const days = useMemo(() => {
    // Rows arrive newest day first, so pushing keeps each day's order.
    const byDay = new Map<string, FundTransaction[]>();
    for (const t of transactions) {
      const items = byDay.get(t.occurred_on);
      if (items) items.push(t);
      else byDay.set(t.occurred_on, [t]);
    }
    return [...byDay].map(([day, items]) => ({
      day,
      label: dayjs(day).format(DAY_FORMAT),
      items,
      net: items.reduce(
        (sum, t) => (t.deleted_at ? sum : sum + signedAmount(t)),
        0,
      ),
    }));
  }, [transactions]);

  return (
    <div className='flex flex-col gap-4'>
      {days.map(({ day, label, items, net }) => (
        <section
          key={day}
          className='overflow-hidden rounded-lg border bg-card'
        >
          <header className='flex items-center justify-between gap-3 border-b bg-surface-muted px-4 py-2 text-sm'>
            <span className='font-medium text-foreground'>{label}</span>
            <span className='text-foreground-light tabular-nums'>
              {formatSigned(net)}
            </span>
          </header>
          <ul className='divide-y'>
            {items.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                addedBy={memberName(members, t.created_by)}
                editable={!t.deleted_at && canEdit(t)}
                onEdit={onEdit}
                onDelete={onDelete}
                onHistory={onHistory}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
});

interface TransactionRowProps {
  transaction: FundTransaction;
  addedBy: string;
  editable: boolean;
  onEdit: (transaction: FundTransaction) => void;
  onDelete: (transaction: FundTransaction) => void;
  onHistory: (transaction: FundTransaction) => void;
}

const TransactionRow = memo(function TransactionRow({
  transaction: t,
  addedBy,
  editable,
  onEdit,
  onDelete,
  onHistory,
}: TransactionRowProps) {
  const deleted = !!t.deleted_at;
  return (
    <li className={cn("flex items-center gap-1 pe-2", deleted && "opacity-60")}>
      <div className='flex min-w-0 flex-1 items-center gap-3 py-3 ps-4'>
        <FundKindIcon kind={t.kind} />
        <span className='flex min-w-0 flex-1 flex-col'>
          {t.note && (
            <span className='truncate text-xs text-foreground-light'>
              {t.note}
            </span>
          )}
          <span className="truncate text-xs font-medium before:me-1 before:font-normal before:text-muted-foreground before:content-['Added_by']">
            {addedBy}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 text-sm font-medium tabular-nums",
            t.kind === "contribute" ? "text-brand-strong" : "text-destructive",
            deleted && "line-through",
          )}
        >
          {formatSigned(signedAmount(t))}
        </span>
      </div>
      <Button
        type='text'
        size='small'
        icon={<History />}
        title='History'
        aria-label='Transaction history'
        onClick={() => onHistory(t)}
      />
      {editable && (
        <>
          <Button
            type='text'
            size='small'
            icon={<Pencil />}
            title='Edit'
            aria-label='Edit transaction'
            onClick={() => onEdit(t)}
          />
          <Button
            type='text'
            size='small'
            danger
            icon={<Trash2 />}
            title='Delete'
            aria-label='Delete transaction'
            onClick={() => onDelete(t)}
          />
        </>
      )}
    </li>
  );
});
