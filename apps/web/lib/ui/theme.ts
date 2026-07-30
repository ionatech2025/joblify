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
 * Next theme in the toggle's cycle.
 *
 * Not a plain light → dark → system rotation: the stored default is `system`,
 * so a plain rotation would make the very first click land on whichever
 * explicit value the OS was already resolving to, and appear to do nothing.
 * From `system` we jump to the opposite of what's on screen, which guarantees
 * the first click is visible while keeping `system` one more click away.
 */
export function nextTheme(current: Theme, prefersDark: boolean): Theme {
  if (current === 'system') return prefersDark ? 'light' : 'dark';
  return current === 'light' ? 'dark' : 'system';
}

/** Human label for the control, describing what the next click will do. */
export function themeActionLabel(next: Theme): string {
  return next === 'system' ? 'Use the system theme' : `Switch to ${next} theme`;
}

/**
 * Applies a theme to <html>. Client-only at call time (reads matchMedia), but
 * importable anywhere.
 */
export function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', resolvesDark(theme, prefersDark));
}
