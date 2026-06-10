import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Global UI state. Persisted slices use localStorage; ephemeral slices don't.

export type Theme = 'light' | 'dark' | 'system';

type UiState = {
  // Ephemeral
  isMobileMenuOpen: boolean;
  isCookieBannerOpen: boolean;

  // Persisted
  theme: Theme;

  setMobileMenuOpen: (open: boolean) => void;
  setCookieBannerOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isMobileMenuOpen: false,
      isCookieBannerOpen: true,
      theme: 'system',
      setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
      setCookieBannerOpen: (isCookieBannerOpen) => set({ isCookieBannerOpen }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'joblify.ui',
      // Persist only what should survive a reload.
      partialize: (state) => ({ theme: state.theme }),
      version: 1,
    },
  ),
);
