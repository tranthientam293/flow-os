import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_STALE_TIME_MS } from "@/constants";
import { getErrorMessage } from "@/utils";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (data, variables, _onMutateResult, mutation) => {
      const message = mutation.meta?.successMessage;
      if (message)
        toast.success(
          typeof message === "function" ? message(data, variables) : message,
        );
    },
    onError: (error, _variables, _onMutateResult, mutation) => {
      const message = mutation.meta?.errorMessage;
      if (message)
        toast.error(typeof message === "function" ? message() : message, {
          description: getErrorMessage(error),
        });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME_MS,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});
