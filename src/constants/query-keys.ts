export const QUERY_KEYS = {
  profile: (userId: string) => ["profile", userId] as const,
  installedApps: (userId: string) => ["installed-apps", userId] as const,
  appStorage: (userId: string, appId: string, key: string) =>
    ["app-storage", userId, appId, key] as const,
  health: ["health"] as const,
};
