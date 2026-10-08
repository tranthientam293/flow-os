import {
  CalendarDays,
  ListTodo,
  MapPin,
  Settings2,
  Shapes,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Membership } from "../models/roster";

export type RosterSection = "centers" | "work";

export type RosterTab =
  "schedule" | "week" | "trainers" | "branches" | "types" | "settings";

export const SETTINGS_PATH = "settings";

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
      "Open a center to see its schedule and manage its trainers, branches, session types and settings.",
    includes: (m) => m.role === "owner",
    tabs: [
      { key: "schedule", label: "Schedule", icon: CalendarDays },
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
    tabs: [
      { key: "week", label: "My week", icon: ListTodo },
      { key: "schedule", label: "Calendar", icon: CalendarDays },
    ],
  },
];

export const sectionOf = (key: RosterSection) =>
  SECTIONS.find((s) => s.key === key) ?? SECTIONS[0];
