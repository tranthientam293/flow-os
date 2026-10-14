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
};
