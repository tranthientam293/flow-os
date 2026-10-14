import {
  CalendarDays,
  MapPin,
  Settings2,
  Shapes,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Membership } from "../models/roster";

export type RosterSection = "centers" | "work";

export type RosterTab =
  | "schedule"
  | "week"
  | "trainers"
  | "branches"
  | "types"
  | "repeats"
  | "settings";

export const SETTINGS_PATH = "settings";
export const INCOME_PATH = "income";
export const REPEATS_PATH = "repeats";

export const SECTIONS: {
  key: RosterSection;
  label: string;
  title: string;
  description: string;
  includes: (membership: Membership) => boolean;
  tabs: { key: RosterTab; label: string; icon: LucideIcon }[];
}[] = [
  {
    key: "centers",
    label: "Manage centers",
    title: "Centers you own",
    description:
      "Open a center to manage its trainers, branches, session types and settings.",
    includes: (m) => m.role === "owner",
    // Hidden in this release: the center's Schedule and Repeats tabs (their
    // views, ScheduleView and CenterRepeatsView, stay in the code). Links to
    // them land on the first tab.
    tabs: [
      { key: "trainers", label: "Trainers", icon: Users },
      { key: "branches", label: "Branches", icon: MapPin },
      { key: "types", label: "Session types", icon: Shapes },
      { key: "settings", label: "Settings", icon: Settings2 },
    ],
  },
  {
    key: "work",
    label: "My schedule",
    title: "Your trainer schedule",
    description:
      "Your sessions at every center you train at. Book, change or cancel them here.",
    includes: (m) => m.role === "trainer" || m.also_trainer,
    // Hidden in this release: the My week tab (MyWeekView stays in the code).
    // Links to it land on Calendar.
    tabs: [{ key: "schedule", label: "Calendar", icon: CalendarDays }],
  },
];

export const sectionOf = (key: RosterSection) =>
  SECTIONS.find((s) => s.key === key) ?? SECTIONS[0];
