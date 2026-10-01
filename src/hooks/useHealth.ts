import { useQuery } from "@tanstack/react-query";
import { healthQueryOptions } from "@/apis";
import type { HealthStatus } from "@/types";
import { getErrorMessage } from "@/utils";

export function useHealth(): HealthStatus {
  const query = useQuery(healthQueryOptions());
  if (query.isPending) return { state: "checking" };
  if (query.isError)
    return { state: "down", message: getErrorMessage(query.error) };
  return { state: "healthy", latencyMs: query.data };
}
