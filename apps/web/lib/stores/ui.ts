import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Global UI state. Persisted slices use localStorage; ephemeral slices don't.

export type Theme = 'light' | 'dark' | 'system';

export type ToastTone = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
};

// Monotonic ids: a toast only has to be unique among the handful on screen at
// once, and a counter keeps the store deterministic under test.
let toastSeq = 0;

type UiState = {
  // Ephemeral
  isMobileMenuOpen: boolean;
  isCookieBannerOpen: boolean;
  isCommandPaletteOpen: boolean;
  toasts: Toast[];

  // Persisted
  theme: Theme;

  setMobileMenuOpen: (open: boolean) => void;
  setCookieBannerOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  pushToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
};

/**
 * What survives a reload. Exported so the contract is testable directly:
 * leaking an ephemeral slice in here means a stale toast or a stuck-open
 * command palette reappears on every page load.
 *
 * The pre-paint theme script (app/components/theme-script.tsx) reads the shape
 * this produces out of localStorage, so changing it means changing that script.
 */
export function persistedUiState(state: UiState): { theme: Theme } {
  return { theme: state.theme };
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isMobileMenuOpen: false,
      isCookieBannerOpen: true,
      isCommandPaletteOpen: false,
      toasts: [],
      theme: 'system',
      setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
      setCookieBannerOpen: (isCookieBannerOpen) => set({ isCookieBannerOpen }),
      setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
      setTheme: (theme) => set({ theme }),
      pushToast: (toast) => {
        const id = `t${++toastSeq}`;
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
        return id;
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'joblify.ui',
      partialize: persistedUiState,
      version: 1,
    },
  ),
);

/**
 * Imperative toast helper for call sites that aren't React components
 * (Server Action result handlers, catch blocks). Inside a component prefer
 * `useUiStore((s) => s.pushToast)`.
 */
export const toast = {
  success: (title: string, description?: string) =>
    useUiStore.getState().pushToast({ tone: 'success', title, description }),
  error: (title: string, description?: string) =>
    useUiStore.getState().pushToast({ tone: 'error', title, description }),
  info: (title: string, description?: string) =>
    useUiStore.getState().pushToast({ tone: 'info', title, description }),
};
