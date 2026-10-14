export const EXPENSES_PATH = "expenses";
export const SETTINGS_PATH = "settings";

// Header tabs; "" is the app's home (the dashboard).
export const SECTIONS = [
  { path: "", label: "Dashboard" },
  { path: EXPENSES_PATH, label: "Expenses" },
] as const;
