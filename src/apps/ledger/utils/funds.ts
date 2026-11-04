import dayjs from "dayjs";
import { DATE_FORMAT } from "@/constants";
import type {
  FundMember,
  FundTransaction,
  FundTransactionKind,
  FundTransactionRevision,
} from "../models/ledger";
import { formatAmount } from "./money";

export const KIND_LABEL: Record<FundTransactionKind, string> = {
  contribute: "Put in",
  spend: "Used",
};

// +amount for money put in, −amount for money used.
export const signedAmount = (t: Pick<FundTransaction, "kind" | "amount">) =>
  t.kind === "contribute" ? t.amount : -t.amount;

export const formatSigned = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatAmount(Math.abs(value))}`;

export interface FundTotals {
  contributed: number;
  spent: number;
  balance: number;
}

const emptyTotals = (): FundTotals => ({
  contributed: 0,
  spent: 0,
  balance: 0,
});

const add = (totals: FundTotals, t: FundTransaction) => {
  if (t.kind === "contribute") totals.contributed += t.amount;
  else totals.spent += t.amount;
  totals.balance = totals.contributed - totals.spent;
};

// The fund's totals and each member's, over transactions that aren't deleted.
export function fundTotals(transactions: FundTransaction[]) {
  const fund = emptyTotals();
  const byMember = new Map<string, FundTotals>();
  for (const t of transactions) {
    if (t.deleted_at) continue;
    add(fund, t);
    const member = byMember.get(t.member_id) ?? emptyTotals();
    add(member, t);
    byMember.set(t.member_id, member);
  }
  return { fund, byMember };
}

// "Linh", "Linh (removed)", or "Unknown" for a member that can't be found.
export const memberName = (
  members: Map<string, FundMember>,
  id: string | null,
) => {
  const m = id ? members.get(id) : undefined;
  if (!m) return "Unknown";
  return m.removed_at ? `${m.display_name} (removed)` : m.display_name;
};

export interface RevisionChange {
  label: string;
  from: string;
  to: string;
}

type Snapshot = Pick<
  FundTransactionRevision,
  "kind" | "member_id" | "amount" | "note" | "occurred_on"
>;

// What a revision changed compared with the one before it.
export function revisionChanges(
  previous: Snapshot,
  next: Snapshot,
  members: Map<string, FundMember>,
): RevisionChange[] {
  const changes: RevisionChange[] = [];
  const push = (label: string, from: string, to: string) =>
    from !== to && changes.push({ label, from, to });
  push("Type", KIND_LABEL[previous.kind], KIND_LABEL[next.kind]);
  push(
    "Person",
    memberName(members, previous.member_id),
    memberName(members, next.member_id),
  );
  push("Amount", formatAmount(previous.amount), formatAmount(next.amount));
  push(
    "Date",
    dayjs(previous.occurred_on).format(DATE_FORMAT),
    dayjs(next.occurred_on).format(DATE_FORMAT),
  );
  push("Note", previous.note || "—", next.note || "—");
  return changes;
}
