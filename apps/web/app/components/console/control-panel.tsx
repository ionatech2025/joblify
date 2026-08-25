import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ConsoleWidth } from './shell';

/**
 * The control panel — Odoo's second bar, and the single most load-bearing
 * pattern in this refresh. Every console view gets the same four affordances in
 * the same place, so "where am I / what can I do / how do I look at it" is
 * answered identically on every screen:
 *
 *   row 1  breadcrumb ......................... record pager
 *   row 2  actions + search ................... view switcher
 *
 * Everything in here is a plain link driven by the URL, so the whole bar stays
 * a server component: no hydration cost, and back/forward, refresh and a shared
 * link all reproduce the exact view. That is the same convention jobs-search.tsx
 * and the applicants board already use for their own state.
 */
export function ControlPanel({
  breadcrumb,
  pager,
  actions,
  search,
  views,
}: {
  breadcrumb: ReactNode;
  pager?: ReactNode;
  actions?: ReactNode;
  search?: ReactNode;
  views?: ReactNode;
}) {
  const hasSecondRow = Boolean(actions || search || views);
  return (
    <div className="o-chrome-bar shadow-o-chrome sticky top-[calc(var(--o-header-h)+var(--o-nav-h))] z-30 border-b">
      <ConsoleWidth className="py-1.5">
        <div className="flex min-h-7 flex-wrap items-center justify-between gap-x-4 gap-y-1">
          {breadcrumb}
          {pager}
        </div>
        {hasSecondRow && (
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {actions}
              {search}
            </div>
            {views}
          </div>
        )}
      </ConsoleWidth>
    </div>
  );
}

export type Crumb = { label: string; href?: string };

/**
 * Breadcrumb. The last crumb is the current record and never a link — it
 * carries `aria-current="page"` instead. Ancestors are links, which is the
 * escape hatch the old flat pill-nav never had: from a job's applicants you
 * could only get back to the list via the browser's Back button.
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 && (
                <span aria-hidden className="text-fg-subtle px-0.5 text-[13px]">
                  /
                </span>
              )}
              {last ? (
                <h1
                  aria-current="page"
                  className="text-fg max-w-[42ch] truncate text-[15px] font-semibold sm:max-w-none"
                  title={c.label}
                >
                  {c.label}
                </h1>
              ) : c.href ? (
                <Link
                  href={c.href}
                  className="text-fg-muted hover:text-fg max-w-[24ch] truncate text-[13px] no-underline transition-colors"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="text-fg-muted text-[13px]">{c.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Record pager — "4 / 12" with prev/next. Odoo puts this on every form view and
 * it is the fix for the console's worst navigational dead end: opening a job's
 * applicants used to require a round trip through the list to reach the next
 * job. `prevHref`/`nextHref` are omitted at the ends, which renders a disabled
 * control rather than removing it (so the row doesn't reflow).
 */
export function RecordPager({
  index,
  total,
  prevHref,
  nextHref,
  label = 'record',
}: {
  /** 1-based position of the current record. */
  index: number;
  total: number;
  prevHref?: string;
  nextHref?: string;
  label?: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <span className="text-fg-muted text-[12px] tabular-nums">
        <span className="sr-only">{label} </span>
        {index} / {total}
      </span>
      <PagerButton href={prevHref} label={`Previous ${label}`} icon={ChevronLeft} />
      <PagerButton href={nextHref} label={`Next ${label}`} icon={ChevronRight} />
    </div>
  );
}

function PagerButton({
  href,
  label,
  icon: Icon,
}: {
  href?: string;
  label: string;
  icon: LucideIcon;
}) {
  const shape =
    'grid size-6 place-items-center rounded-control border border-border transition-colors';
  if (!href) {
    return (
      <span aria-hidden className={cn(shape, 'text-fg-subtle opacity-40')}>
        <Icon className="size-3.5" />
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      scroll={false}
      className={cn(shape, 'text-fg-muted hover:bg-surface-sunken hover:text-fg no-underline')}
    >
      <Icon aria-hidden className="size-3.5" />
    </Link>
  );
}

export type ViewOption = { key: string; label: string; href: string; icon: LucideIcon };

/**
 * View switcher — list / kanban / calendar in Odoo. Same records, different
 * shape, and which one you are in is part of the URL so it survives a reload.
 * Rendered as a radiogroup rather than tabs: these are alternative renderings
 * of one dataset, not sibling panels of content.
 */
export function ViewSwitcher({ views, active }: { views: ViewOption[]; active: string }) {
  return (
    <div
      role="group"
      aria-label="View"
      className="border-border flex shrink-0 items-center overflow-hidden rounded-control border"
    >
      {views.map((v) => {
        const isActive = v.key === active;
        const Icon = v.icon;
        return (
          <Link
            key={v.key}
            href={v.href}
            scroll={false}
            aria-current={isActive ? 'true' : undefined}
            title={v.label}
            className={cn(
              'border-border grid size-7 place-items-center border-l no-underline transition-colors first:border-l-0',
              isActive
                ? 'bg-ink text-ink-fg'
                : 'text-fg-muted hover:bg-surface-sunken hover:text-fg',
            )}
          >
            <Icon aria-hidden className="size-3.5" />
            <span className="sr-only">{v.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
