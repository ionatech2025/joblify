'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Theme } from '@/lib/stores/ui';

// The Radix half of the header theme control, split out so that
// @radix-ui/react-dropdown-menu (menu, popper, floating-ui, focus scope,
// dismissable layer, roving focus — ~25 KB gzip) is fetched when someone is
// about to use the menu instead of by every visitor on every page.
// theme-toggle.tsx imports this lazily; nothing else may import it statically
// or the split is undone.

const OPTIONS: ReadonlyArray<{ theme: Theme; label: string; icon: typeof Sun }> = [
  { theme: 'light', label: 'Light', icon: Sun },
  { theme: 'dark', label: 'Dark', icon: Moon },
  { theme: 'system', label: 'System', icon: Monitor },
];

/**
 * Rendered in place of the plain trigger button once the menu is wanted, so
 * `triggerClassName` and `trigger` content must match what theme-toggle.tsx
 * draws before the swap — the button must not change as it is replaced.
 */
export default function ThemeMenu({
  theme,
  onChoose,
  triggerClassName,
  children,
}: {
  theme: Theme;
  onChoose: (theme: Theme) => void;
  triggerClassName: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Change theme"
          title="Change theme"
          className={triggerClassName}
        >
          {children}
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
              onSelect={() => onChoose(optionTheme)}
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
