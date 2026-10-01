import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { queryClient, i18n } from "@/libs";
import { useThemeSync } from "@/hooks";
import { TooltipProvider, Toaster } from "@/components/atoms";
import { AuthProvider } from "@/context";

export function AppProviders({ children }: { children: ReactNode }) {
  useThemeSync();
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster position='bottom-right' />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
