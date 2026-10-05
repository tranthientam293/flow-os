import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/libs";
import { useThemeSync } from "@/hooks";
import { AuthProvider } from "@/context";
import { AntdProvider } from "./AntdProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  useThemeSync();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AntdProvider>{children}</AntdProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
