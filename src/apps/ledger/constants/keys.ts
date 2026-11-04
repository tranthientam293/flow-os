export const LEDGER_KEYS = {
  all: ["ledger"] as const,
  expenses: (userId: string) => ["ledger", "expenses", userId] as const,
  // month: YYYY-MM
  monthExpenses: (userId: string, month: string) =>
    ["ledger", "expenses", userId, month] as const,
  // The 12 months ending with `month` (YYYY-MM); under `expenses` so saving
  // or deleting refreshes it too.
  yearExpenses: (userId: string, month: string) =>
    ["ledger", "expenses", userId, "year", month] as const,
  settings: (userId: string) => ["ledger", "settings", userId] as const,
  // Everything about funds sits under `funds`, so one invalidation refreshes
  // the list's balances along with a fund's members and transactions.
  funds: (userId: string) => ["ledger", "funds", userId] as const,
  // The user's open invitations.
  fundInvites: (userId: string) =>
    ["ledger", "funds", userId, "invites"] as const,
  fund: (userId: string, fundId: string) =>
    ["ledger", "funds", userId, fundId] as const,
  fundMembers: (userId: string, fundId: string) =>
    ["ledger", "funds", userId, fundId, "members"] as const,
  fundTransactions: (userId: string, fundId: string) =>
    ["ledger", "funds", userId, fundId, "transactions"] as const,
  fundRevisions: (userId: string, fundId: string, transactionId: string) =>
    ["ledger", "funds", userId, fundId, "revisions", transactionId] as const,
};
