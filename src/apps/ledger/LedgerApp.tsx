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

export default function LedgerApp() {
  const paths = useLedgerPaths();

  return (
    <ExpenseEditorProvider>
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
