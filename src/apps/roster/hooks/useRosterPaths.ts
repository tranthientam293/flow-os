import { useMemo } from "react";
import { appPath } from "@/constants";
import { useFlowApp } from "@/context";
import {
  DELETED_PATH,
  INCOME_PATH,
  REPEATS_PATH,
  SETTINGS_PATH,
  type RosterSection,
  type RosterTab,
} from "../constants/routes";

export function useRosterPaths() {
  const { app } = useFlowApp();
  return useMemo(() => {
    const base = appPath(app.id);
    return {
      base,
      settings: `${base}/${SETTINGS_PATH}`,
      // My schedule → Income.
      income: `${base}/work/${INCOME_PATH}`,
      // My schedule → Repeats.
      repeats: `${base}/work/${REPEATS_PATH}`,
      // My schedule → Deleted.
      deleted: `${base}/work/${DELETED_PATH}`,
      section: (section: RosterSection) => `${base}/${section}`,
      center: (section: RosterSection, centerId: string, tab?: RosterTab) =>
        `${base}/${section}/${centerId}${tab ? `/${tab}` : ""}`,
    };
  }, [app.id]);
}
