import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { queryClient, i18n } from "@/libs";
import { useThemeSync } from "@/hooks";
import { AuthProvider } from "@/context";
import { AntdProvider } from "./AntdProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  useThemeSync();
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AntdProvider>{children}</AntdProvider>
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
