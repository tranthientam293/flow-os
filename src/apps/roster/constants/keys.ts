export const ROSTER_KEYS = {
  all: ["roster"] as const,
  memberships: (userId: string) => ["roster", "memberships", userId] as const,
  invites: (userId: string) => ["roster", "invites", userId] as const,
  center: (centerId: string) => ["roster", "center", centerId] as const,
  directory: (centerId: string) =>
    ["roster", "center", centerId, "directory"] as const,
  members: (centerId: string) =>
    ["roster", "center", centerId, "members"] as const,
  branches: (centerId: string) =>
    ["roster", "center", centerId, "branches"] as const,
  memberSessionTypes: (centerId: string) =>
    ["roster", "center", centerId, "member-session-types"] as const,
  sessionTypes: (centerId: string) =>
    ["roster", "center", centerId, "session-types"] as const,
  memberBranches: (centerId: string) =>
    ["roster", "center", centerId, "member-branches"] as const,
  sessionEvents: (centerId: string, sessionId: string) =>
    ["roster", "center", centerId, "session-events", sessionId] as const,
  sessionFees: (centerId: string, sessionId: string) =>
    ["roster", "center", centerId, "session-fees", sessionId] as const,
  sessions: (centerId: string, from: string, to: string, memberId?: string) =>
    [
      "roster",
      "center",
      centerId,
      "sessions",
      from,
      to,
      memberId ?? "all",
    ] as const,
};

export const STORAGE_KEYS = {
  activeCenterId: "activeCenterId",
  scheduleView: "scheduleView",
} as const;
