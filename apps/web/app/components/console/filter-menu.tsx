'use client';

import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ArrowDownWideNarrow,
  Check,
  ChevronDown,
  EyeOff,
  Filter,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export type FilterItem = { label: string; href: string; active?: boolean };
export type FilterGroup = { label?: string; items: FilterItem[] };

/**
 * A control-panel dropdown — Odoo's Filters / Group By / Favourites menus.
 *
 * Radix `DropdownMenu` rather than a hand-rolled popover, per the convention
 * set by `ui/theme-toggle.tsx`: focus trapping, Escape, typeahead and outside-
 * click are behaviours worth not reimplementing. Items are `Link`s, so a filter
 * is still a shareable URL and still works with the back button; the menu is
 * only the picker.
 *
 * Icons are named as strings, not passed as components — the same convention
 * `console/nav.tsx` and `lib/ui/commands.ts` already use, and for the same
 * reason. A lucide icon is a forwardRef object holding a function, and this is
 * a client component: a *server* page handing one over fails serialization at
 * request time with "Functions cannot be passed directly to Client Components".
 *
 * That is not hypothetical. Four server pages passed components here —
 * /jobseeker/applications, /company/jobs, /company/applicants/[jobId],
 * /company/jobseekers — and every one of them rendered the error boundary in
 * production. `next build` does not catch it: the static shell prerenders
 * before the control panel's props are serialized for the client, so the build
 * is green and only a real request fails.
 */
const ICONS = {
  ArrowDownWideNarrow,
  EyeOff,
  Filter,
  Users,
} satisfies Record<string, LucideIcon>;

export type FilterMenuIcon = keyof typeof ICONS;
export function FilterMenu({
  label,
  icon,
  groups,
  activeCount = 0,
}: {
  label: string;
  /** Key into ICONS above — a name, never the component itself. */
  icon?: FilterMenuIcon;
  groups: FilterGroup[];
  /** Rendered as a trailing count when any item in this menu is applied. */
  activeCount?: number;
}) {
  const Icon = icon ? ICONS[icon] : undefined;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          'border-border text-fg-muted hover:bg-surface-sunken hover:text-fg focus-visible:ring-brand rounded-control inline-flex shrink-0 items-center gap-1 border px-2 py-1 text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none',
          activeCount > 0 && 'border-brand/40 text-brand',
        )}
      >
        {Icon ? <Icon aria-hidden className="size-3.5" /> : null}
        {label}
        {activeCount > 0 ? (
          <span className="bg-brand-subtle text-brand-subtle-fg rounded-pill px-1 text-[11px] font-semibold">
            {activeCount}
          </span>
        ) : null}
        <ChevronDown aria-hidden className="size-3 opacity-60" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={4}
          align="start"
          // The portal renders outside the .o-console subtree, so the token
          // scope doesn't reach it — `o-console` here re-establishes it.
          className="o-console border-border bg-surface shadow-o-overlay rounded-card z-50 min-w-[13rem] border p-1"
        >
          {groups.map((g, gi) => (
            <div key={g.label ?? gi}>
              {gi > 0 ? <DropdownMenu.Separator className="bg-border my-1 h-px" /> : null}
              {g.label ? (
                <DropdownMenu.Label className="text-fg-subtle px-2 py-1 text-[11px] font-semibold tracking-wide uppercase">
                  {g.label}
                </DropdownMenu.Label>
              ) : null}
              {g.items.map((item) => (
                <DropdownMenu.Item key={item.href} asChild>
                  <Link
                    href={item.href}
                    scroll={false}
                    className={cn(
                      'rounded-control data-highlighted:bg-surface-sunken flex cursor-pointer items-center gap-2 px-2 py-1.5 text-[13px] no-underline outline-none',
                      item.active ? 'text-fg font-semibold' : 'text-fg-muted',
                    )}
                  >
                    <Check
                      aria-hidden
                      className={cn('size-3.5 shrink-0', item.active ? 'opacity-100' : 'opacity-0')}
                    />
                    {item.label}
                  </Link>
                </DropdownMenu.Item>
              ))}
            </div>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
