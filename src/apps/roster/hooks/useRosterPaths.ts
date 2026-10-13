import { useMemo } from "react";
import { appPath } from "@/constants";
import { useFlowApp } from "@/context";
import {
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
      section: (section: RosterSection) => `${base}/${section}`,
      center: (section: RosterSection, centerId: string, tab?: RosterTab) =>
        `${base}/${section}/${centerId}${tab ? `/${tab}` : ""}`,
    };
  }, [app.id]);
}
