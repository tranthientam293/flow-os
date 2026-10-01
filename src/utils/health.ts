import type { HealthStatus, TranslationKey } from "@/types";

export function healthLabelKey(health: HealthStatus): TranslationKey {
  if (health.state === "checking") return "health.checking";
  if (health.state === "healthy") return "health.healthy";
  return "health.unreachable";
}
