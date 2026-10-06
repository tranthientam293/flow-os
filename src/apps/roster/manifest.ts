import { CalendarRange } from "lucide-react";
import type { AppManifest } from "@/types";

export default {
  id: "roster",
  name: "Roster",
  tagline: "Schedules for your center and its trainers",
  description:
    "Owners set up a center with its branches and invite trainers by email. Trainers join from the invitation bell and book their own sessions. Anyone can own one center and be a trainer at another.",
  icon: CalendarRange,
  category: "Productivity",
  version: "2.8.2",
  load: () => import("./RosterApp"),
  getSummary: async (ctx) => (await import("./summary")).getSummary(ctx),
} satisfies AppManifest;
