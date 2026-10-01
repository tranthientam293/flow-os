export interface FlowMutationMeta extends Record<string, unknown> {
  successMessage?: string | ((data: unknown, variables: unknown) => string);
  errorMessage?: string | (() => string);
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: FlowMutationMeta;
  }
}
