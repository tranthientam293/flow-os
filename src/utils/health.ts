import type { HealthStatus } from "@/types";

export function healthLabel(health: HealthStatus) {
  if (health.state === "checking") return "Checking…";
  if (health.state === "healthy") return "Healthy";
  return "Unreachable";
}
