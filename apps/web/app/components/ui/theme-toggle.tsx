'use client';

import { useEffect } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUiStore, type Theme } from '@/lib/stores/ui';
import { useHydrated, usePrefersDarkScheme } from '@/lib/use-hydrated';
import { applyTheme, nextTheme, themeActionLabel } from '@/lib/ui/theme';

const ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

/**
 * Header theme control. Cycles the stored preference (see lib/ui/theme.ts for
 * the ordering rule) and mirrors it onto <html>; the pre-paint script in
 * components/theme-script.tsx reads the same persisted value on the next load.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const prefersDark = usePrefersDarkScheme();
  // The store rehydrates from localStorage after mount, so the first client
  // render can disagree with the server HTML. Holding the icon back until
  // hydration avoids a mismatch; the button box renders at full size
  // throughout so nothing shifts.
  const mounted = useHydrated();

  // Re-runs when the OS preference flips too, which is what keeps 'system' live.
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
  }, [theme, mounted, prefersDark]);

  const next = nextTheme(theme, prefersDark);
  const label = themeActionLabel(next);
  const Icon = ICON[theme];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={mounted ? label : 'Change theme'}
      title={mounted ? label : 'Change theme'}
      className={cn(
        'text-fg-muted hover:bg-surface-sunken hover:text-fg border-border focus-visible:ring-brand focus-visible:ring-offset-canvas grid size-9 shrink-0 place-items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className,
      )}
    >
      {mounted ? <Icon aria-hidden className="size-4" /> : <span className="size-4" />}
    </button>
  );
}
