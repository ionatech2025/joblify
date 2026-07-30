import type { Theme } from '@/lib/stores/ui';

/**
 * Theme resolution rules, kept out of the toggle component so both the header
 * control and the command palette share one source of truth — and so they stay
 * unit-testable without pulling React or lucide into a node-env test.
 */

/** Does this stored preference resolve to the dark palette right now? */
export function resolvesDark(theme: Theme, prefersDark: boolean): boolean {
  return theme === 'dark' || (theme === 'system' && prefersDark);
}

/**
 * Applies a theme to <html>. Client-only at call time (reads matchMedia), but
 * importable anywhere.
 */
export function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', resolvesDark(theme, prefersDark));
}
