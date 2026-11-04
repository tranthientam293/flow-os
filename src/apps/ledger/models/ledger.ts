import type { Dayjs } from "dayjs";
import type { Database, Tables, TablesInsert } from "@/models";

export type Expense = Tables<"ledger_expenses">;
export type ExpenseInsert = TablesInsert<"ledger_expenses">;

// What the expense modal collects.
export interface ExpenseDraft {
  amount: number;
  categoryId: string;
  note?: string;
  date: Dayjs;
}

export type LedgerSettings = Tables<"ledger_settings">;

// Funds: money shared by several people.
export type FundTransactionKind = "contribute" | "spend";
export type FundRole = "owner" | "member";

// A fund as listed for the signed-in user, with its totals.
export type FundSummary = Omit<
  Database["public"]["Functions"]["ledger_my_funds"]["Returns"][number],
  "my_role"
> & { my_role: FundRole };

// invited: added by the owner, not yet accepted; active: in the fund.
export type FundMemberStatus = "invited" | "active";

export type FundMember = Omit<
  Tables<"ledger_fund_members">,
  "role" | "status"
> & {
  role: FundRole;
  status: FundMemberStatus;
};

export type FundTransaction = Omit<
  Tables<"ledger_fund_transactions">,
  "kind"
> & { kind: FundTransactionKind };

export type FundTransactionRevision = Omit<
  Tables<"ledger_fund_transaction_revisions">,
  "kind" | "action"
> & { kind: FundTransactionKind; action: "created" | "edited" | "deleted" };

// What the fund modal collects.
export interface FundDraft {
  name: string;
  note?: string;
}

// What the fund transaction modal collects.
export interface FundTransactionDraft {
  kind: FundTransactionKind;
  memberId: string;
  amount: number;
  note?: string;
  date: Dayjs;
}

// An invitation waiting for the signed-in user to accept or decline.
export type FundInvite =
  Database["public"]["Functions"]["ledger_my_fund_invites"]["Returns"][number];
