import { MutationCache, QueryClient } from "@tanstack/react-query";
import { QUERY_STALE_TIME_MS } from "@/constants";
import { getErrorMessage } from "@/utils";
import { notify } from "./notification";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (data, variables, _onMutateResult, mutation) => {
      const message = mutation.meta?.successMessage;
      if (message)
        notify.success(
          typeof message === "function" ? message(data, variables) : message,
        );
    },
    onError: (error, _variables, _onMutateResult, mutation) => {
      const message = mutation.meta?.errorMessage;
      if (message)
        notify.error(
          typeof message === "function" ? message() : message,
          getErrorMessage(error),
        );
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
