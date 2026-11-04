export const EXPENSES_PATH = "expenses";
export const FUNDS_PATH = "funds";
// Under a fund: funds/:fundId/members.
export const FUND_MEMBERS_PATH = "members";
export const SETTINGS_PATH = "settings";

// Header tabs; "" is the app's home (the dashboard).
export const SECTIONS = [
  { path: "", label: "Dashboard" },
  { path: EXPENSES_PATH, label: "Expenses" },
  { path: FUNDS_PATH, label: "Funds" },
] as const;
