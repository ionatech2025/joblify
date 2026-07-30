'use client';

import { useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUiStore, type Theme } from '@/lib/stores/ui';
import { useHydrated, usePrefersDarkScheme } from '@/lib/use-hydrated';
import { applyTheme } from '@/lib/ui/theme';

const OPTIONS: ReadonlyArray<{ theme: Theme; label: string; icon: typeof Sun }> = [
  { theme: 'light', label: 'Light', icon: Sun },
  { theme: 'dark', label: 'Dark', icon: Moon },
  { theme: 'system', label: 'System', icon: Monitor },
];

const CURRENT_ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

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

  const CurrentIcon = CURRENT_ICON[theme];

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Change theme"
          title="Change theme"
          className={cn(
            'text-fg-muted hover:bg-surface-sunken hover:text-fg border-border focus-visible:ring-brand focus-visible:ring-offset-canvas data-[state=open]:bg-surface-sunken data-[state=open]:text-fg grid size-9 shrink-0 place-items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            className,
          )}
        >
          {mounted ? <CurrentIcon aria-hidden className="size-4" /> : <span className="size-4" />}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="border-border bg-surface shadow-raised rounded-card z-50 w-40 border p-1"
        >
          {OPTIONS.map(({ theme: optionTheme, label, icon: Icon }) => (
            <DropdownMenu.Item
              key={optionTheme}
              onSelect={() => choose(optionTheme)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-[0.625rem] px-2.5 py-2 text-sm outline-none select-none',
                'data-[highlighted]:bg-surface-sunken data-[highlighted]:text-fg',
                theme === optionTheme ? 'text-fg font-medium' : 'text-fg-muted',
              )}
            >
              <Icon aria-hidden className="size-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {theme === optionTheme && <Check aria-hidden className="size-3.5 shrink-0" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
