import { Navigate, Route, Routes } from "react-router";
import { APP_NAME } from "@/constants";
import {
  ExpenseEditorProvider,
  LedgerBottomBar,
  LedgerHeader,
} from "./components/organisms";
import { DashboardPage, ExpensesPage, SettingsPage } from "./components/pages";
import { EXPENSES_PATH, SETTINGS_PATH } from "./constants/routes";
import { useLedgerPaths } from "./hooks/useLedgerPaths";
import "./ledger.css";

// Routes, relative to /apps/ledger (?month=YYYY-MM picks the month):
//   (index)    dashboard: the month at a glance
//   expenses   the month's expenses, grouped by day
//   settings   the user's account and the way back to flowOS
// For the footer; read once when the app loads.
const COPYRIGHT_YEAR = new Date().getFullYear();

export default function LedgerApp() {
  const paths = useLedgerPaths();

  return (
    <ExpenseEditorProvider>
      {/* On phones the header moves to the bottom bar; leave room for it. */}
      <div className='flex min-h-full flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0'>
        <LedgerHeader />
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path={EXPENSES_PATH} element={<ExpensesPage />} />
          <Route path={SETTINGS_PATH} element={<SettingsPage />} />
          <Route path='*' element={<Navigate replace to={paths.base} />} />
        </Routes>
        {/* Quiet copyright line. On phones the extra bottom space keeps it
            clear of the bottom bar's raised + button. */}
        <footer className='mt-auto px-4 pt-8 pb-10 text-center text-[11px] text-muted-foreground/70 sm:pb-6'>
          Original by tranthientam2903 · © {COPYRIGHT_YEAR} {APP_NAME}
        </footer>
        <LedgerBottomBar />
      </div>
    </ExpenseEditorProvider>
  );
}
