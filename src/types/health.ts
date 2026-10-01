export type HealthStatus =
  | { state: "checking" }
  | { state: "healthy"; latencyMs: number }
  | { state: "down"; message: string };
