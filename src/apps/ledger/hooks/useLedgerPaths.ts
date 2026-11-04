import { useMemo } from "react";
import { appPath } from "@/constants";
import { useFlowApp } from "@/context";
import {
  EXPENSES_PATH,
  FUND_MEMBERS_PATH,
  FUNDS_PATH,
  SETTINGS_PATH,
} from "../constants/routes";

export function useLedgerPaths() {
  const { app } = useFlowApp();
  return useMemo(() => {
    const base = appPath(app.id);
    return {
      base,
      expenses: `${base}/${EXPENSES_PATH}`,
      funds: `${base}/${FUNDS_PATH}`,
      fund: (fundId: string) => `${base}/${FUNDS_PATH}/${fundId}`,
      fundMembers: (fundId: string) =>
        `${base}/${FUNDS_PATH}/${fundId}/${FUND_MEMBERS_PATH}`,
      settings: `${base}/${SETTINGS_PATH}`,
      section: (path: string) => (path ? `${base}/${path}` : base),
    };
  }, [app.id]);
}
