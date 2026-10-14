import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient, supabase } from "@/libs";
import { ROSTER_KEYS } from "../constants/keys";
import type { TrainerRate } from "../models/roster";
import { check } from "../utils/errors";

// Trainers' own salary per hour. RLS returns only yours as a trainer, and
// every trainer's to the owner.
export const trainerRatesQueryOptions = (centerId: string) =>
  queryOptions({
    queryKey: ROSTER_KEYS.trainerRates(centerId),
    queryFn: async (): Promise<TrainerRate[]> =>
      check(
        await supabase
          .from("roster_trainer_rates")
          .select("*")
          .eq("center_id", centerId),
      ),
  });

export type MyRate = { sessionTypeId: string; hourlyRate: number | null };

// Saves your own salary per hour for each session type; null removes yours,
// so the owner's rate applies again.
export const saveMyRatesMutationOptions = (
  centerId: string,
  memberId: string,
) =>
  mutationOptions({
    mutationFn: async (rates: MyRate[]) => {
      const set = rates.filter((r) => r.hourlyRate !== null);
      const cleared = rates
        .filter((r) => r.hourlyRate === null)
        .map((r) => r.sessionTypeId);
      if (set.length)
        check(
          await supabase.from("roster_trainer_rates").upsert(
            set.map((r) => ({
              center_id: centerId,
              member_id: memberId,
              session_type_id: r.sessionTypeId,
              hourly_rate: r.hourlyRate as number,
            })),
          ),
        );
      if (cleared.length)
        check(
          await supabase
            .from("roster_trainer_rates")
            .delete()
            .eq("member_id", memberId)
            .in("session_type_id", cleared),
        );
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ROSTER_KEYS.trainerRates(centerId),
      }),
    meta: { successMessage: "Salary saved", errorMessage: "Could not save" },
  });
