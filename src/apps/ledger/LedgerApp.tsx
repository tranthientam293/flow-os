import { Navigate, Route, Routes } from "react-router";
import { AppFooter } from "@/components/molecules";
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
        <AppFooter />
        <LedgerBottomBar />
      </div>
    </ExpenseEditorProvider>
  );
}
