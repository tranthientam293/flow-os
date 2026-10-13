import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/constants";

type UiState = {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  launchingAppId: string | null;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setLaunchingAppId: (appId: string | null) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      launchingAppId: null,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      setLaunchingAppId: (launchingAppId) => set({ launchingAppId }),
    }),
    {
      name: STORAGE_KEYS.UI,
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
);
