'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Bookmark,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  FileText,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { ConsoleWidth } from './shell';

/**
 * Icons are named as strings, not passed as components — the same convention
 * `lib/ui/commands.ts` uses for the command palette. A lucide icon is a
 * function, and a server layout handing one to this client component fails the
 * build with "Functions cannot be passed directly to Client Components".
 */
const ICONS: Record<string, LucideIcon> = {
  Bell,
  Bookmark,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  FileText,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
};

export type ConsoleNavLink = {
  href: string;
  label: string;
  /** Key into ICONS above. */
  icon?: keyof typeof ICONS | (string & {});
  /** Live count rendered as a trailing pip (unread chats, notifications). */
  count?: number;
};

/**
 * The module bar — Odoo's app-level menu. Replaces the editorial `PillNav` on
 * console surfaces: pills read as "tags you can pick", a menu bar reads as
 * "sections of one application", which is what these are.
 *
 * The active item is the longest href that prefixes the current path, so
 * /company/jobs/42/edit still lights "Jobs" rather than nothing. Unlike
 * PillNav there is no entry for a *create* action — "New" belongs on the
 * control panel of the list it creates into, which is where it now lives.
 *
 * Client component purely for usePathname(); it always renders inside a
 * Suspense-gated subtree (the layout auth gate), never at root-layout scope
 * where uncached reads collapse the PPR shell.
 */
export function ConsoleNav({
  module,
  links,
  moduleHref,
}: {
  /** App name shown at the left, e.g. "Recruitment". */
  module: string;
  links: ConsoleNavLink[];
  moduleHref?: string;
}) {
  const pathname = usePathname();
  const activeHref = links.reduce<string | null>((best, l) => {
    const matches = pathname === l.href || pathname.startsWith(`${l.href}/`);
    if (!matches) return best;
    return best && best.length > l.href.length ? best : l.href;
  }, null);

  return (
    <nav
      aria-label={module}
      className="o-chrome-bar shadow-o-chrome sticky top-[var(--o-header-h)] z-40 border-b"
    >
      <ConsoleWidth className="flex h-[calc(var(--o-nav-h)-1px)] items-stretch gap-1 overflow-x-auto">
        <span className="flex shrink-0 items-center pr-3 text-[13px] font-semibold tracking-tight">
          {moduleHref ? (
            <Link href={moduleHref} className="text-fg no-underline">
              {module}
            </Link>
          ) : (
            module
          )}
        </span>
        {links.map((l) => {
          const isActive = activeHref === l.href;
          const Icon = l.icon ? ICONS[l.icon] : undefined;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                // -2px bottom margin pulls the active underline onto the bar's
                // own border so the two read as one line, not two.
                'group relative -mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2 text-[13px] whitespace-nowrap no-underline transition-colors',
                isActive
                  ? 'border-brand text-fg font-semibold'
                  : 'text-fg-muted hover:border-border-strong hover:text-fg border-transparent',
              )}
            >
              {Icon ? <Icon aria-hidden className="size-3.5" /> : null}
              {l.label}
              {l.count ? (
                <span
                  className="bg-danger text-fg-inverse ml-0.5 inline-flex min-w-[1.05rem] items-center justify-center rounded-pill px-1 text-[10px] font-bold"
                  aria-label={`${l.count} unread`}
                >
                  {l.count > 9 ? '9+' : l.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </ConsoleWidth>
    </nav>
  );
}
