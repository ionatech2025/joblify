'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUiStore, type Theme } from '@/lib/stores/ui';
import { useHydrated, usePrefersDarkScheme } from '@/lib/use-hydrated';
import { applyTheme } from '@/lib/ui/theme';

const CURRENT_ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

// The menu is its own chunk (see theme-menu.tsx). `loadMenu` is also what the
// hover/focus handlers call, so by the time a click lands the chunk is usually
// already on its way or in.
const loadMenu = () => import('./theme-menu');
const ThemeMenu = lazy(loadMenu);

/**
 * Header theme control. A Radix dropdown exposing Light/Dark/System
 * directly — the pattern most current apps use (GitHub, the Vercel
 * dashboard, shadcn/ui) — rather than a single button that silently cycles
 * on click. Matches the command palette's existing theme-* commands, which
 * already offered the three choices explicitly; this makes the header
 * control consistent with that instead of a second, different interaction.
 *
 * Radix supplies the accessible menu mechanics (roving focus, Escape,
 * typeahead, focus return to the trigger) — nothing here hand-rolls that.
 * lib/ui/theme.ts's resolvesDark/applyTheme stay the source of truth for
 * resolving + applying a choice; the pre-paint script in theme-script.tsx
 * reads the same persisted value on the next load.
 *
 * What this file does hand-roll is the *trigger*: a plain button that looks and
 * announces itself exactly like Radix's (aria-haspopup / aria-expanded), and
 * that is swapped for the Radix-wrapped one — opening the menu as it mounts —
 * the first time it is activated. Radix's menu is ~25 KB gzip, and until
 * someone changes the theme none of it is needed; this control is on every page.
 * The theme effect below stays here, outside the lazy part, so the theme is
 * applied (and follows the OS under 'system') whether or not the menu is ever
 * opened.
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
  const [wanted, setWanted] = useState(false);

  // Re-runs when the OS preference flips too, which is what keeps 'system' live.
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
  }, [theme, mounted, prefersDark]);

  const CurrentIcon = CURRENT_ICON[theme];

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  const triggerClassName = cn(
    'text-fg-muted hover:bg-surface-sunken hover:text-fg border-border focus-visible:ring-brand focus-visible:ring-offset-canvas data-[state=open]:bg-surface-sunken data-[state=open]:text-fg grid size-[36px] shrink-0 place-items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    className,
  );
  const icon = mounted ? (
    <CurrentIcon aria-hidden className="size-4" />
  ) : (
    <span className="size-4" />
  );

  const plainTrigger = (
    <button
      type="button"
      aria-label="Change theme"
      title="Change theme"
      aria-haspopup="menu"
      aria-expanded={false}
      className={triggerClassName}
      onPointerEnter={() => void loadMenu()}
      onFocus={() => void loadMenu()}
      onClick={() => setWanted(true)}
      onKeyDown={(e) => {
        // The menu-button pattern also opens on ArrowDown.
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setWanted(true);
        }
      }}
    >
      {icon}
    </button>
  );

  if (!wanted) return plainTrigger;

  return (
    // The plain trigger stays on screen while the chunk loads, then the real
    // one takes its place already open.
    <Suspense fallback={plainTrigger}>
      <ThemeMenu theme={theme} onChoose={choose} triggerClassName={triggerClassName}>
        {icon}
      </ThemeMenu>
    </Suspense>
  );
}
