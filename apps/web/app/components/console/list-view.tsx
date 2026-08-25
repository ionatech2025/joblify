import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SortDir = 'asc' | 'desc';
export type ListSort = { key: string; dir: SortDir };

export type ListColumn<T> = {
  /** Stable identity for the column; also the React key. */
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Numerics and dates right-align, so a column of figures scans as a column. */
  align?: 'start' | 'end';
  /**
   * Sort key. Set it and the header becomes a link that flips direction; the
   * page decides what that key means in its `orderBy`, so sorting happens in
   * the database rather than over one already-truncated page of rows.
   */
  sort?: string;
  /** Drop the column on narrow viewports instead of letting the table scroll. */
  hideBelow?: 'sm' | 'md' | 'lg';
  /** Rendered in the footer aggregate row. Omit for no aggregate. */
  aggregate?: (rows: T[]) => ReactNode;
  width?: string;
};

const HIDE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

/**
 * The list view. Dense rows, a sticky sortable header, and — the part a plain
 * table never has — a footer aggregate row, so "12 jobs, 143 applicants" is
 * read off the bottom of the column it belongs to instead of a separate stat
 * card above the table repeating the same numbers.
 *
 * Sort and paging are URL state, which makes this a pure server component: no
 * hydration cost on the heaviest surface in the app, and a shared link
 * reproduces the exact view. Both are also *server-side* — the previous tables
 * fetched every row unbounded and offered no ordering at all.
 *
 * Deliberately no row-selection checkboxes: Odoo's are there to drive bulk
 * actions, and no bulk mutation exists server-side yet, so they would be a
 * control that does nothing. See docs/DESIGN.md for the deferred list.
 */
export function ListView<T>({
  columns,
  rows,
  rowKey,
  sort,
  hrefForSort,
  caption,
  className,
}: {
  columns: ListColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sort?: ListSort;
  /** Builds the href for clicking a sortable header. Required with `sort`. */
  hrefForSort?: (key: string, dir: SortDir) => string;
  /** Screen-reader name for the table. */
  caption: string;
  className?: string;
}) {
  const hasAggregates = columns.some((c) => c.aggregate);
  return (
    <div className={cn('border-border bg-surface rounded-card overflow-x-auto border', className)}>
      <table className="w-full border-collapse text-[13px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-border bg-surface-sunken border-b">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                aria-sort={
                  c.sort && sort?.key === c.sort
                    ? sort.dir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : c.sort
                      ? 'none'
                      : undefined
                }
                className={cn(
                  'text-fg-muted px-2.5 py-1.5 font-semibold whitespace-nowrap',
                  c.align === 'end' ? 'text-right' : 'text-left',
                  c.hideBelow && HIDE[c.hideBelow],
                  c.width,
                )}
              >
                {c.sort && hrefForSort ? (
                  <SortHeader
                    label={c.header}
                    active={sort?.key === c.sort ? sort.dir : undefined}
                    href={hrefForSort(
                      c.sort,
                      // Clicking the active column flips it; a fresh column
                      // starts ascending, except the already-descending default
                      // the caller expresses by passing `sort`.
                      sort?.key === c.sort && sort.dir === 'asc' ? 'desc' : 'asc',
                    )}
                    align={c.align}
                  />
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-border hover:bg-surface-sunken border-b transition-colors last:border-0"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'px-2.5 py-1.5 align-middle',
                    c.align === 'end' ? 'text-right tabular-nums' : 'text-left',
                    c.hideBelow && HIDE[c.hideBelow],
                  )}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {hasAggregates && rows.length > 0 && (
          <tfoot>
            <tr className="border-border bg-surface-sunken border-t">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'text-fg px-2.5 py-1.5 font-semibold',
                    c.align === 'end' ? 'text-right tabular-nums' : 'text-left',
                    c.hideBelow && HIDE[c.hideBelow],
                  )}
                >
                  {c.aggregate?.(rows)}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function SortHeader({
  label,
  href,
  active,
  align,
}: {
  label: string;
  href: string;
  active?: SortDir;
  align?: 'start' | 'end';
}) {
  const Icon = active === 'asc' ? ArrowUp : active === 'desc' ? ArrowDown : ChevronsUpDown;
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        'group inline-flex items-center gap-1 no-underline transition-colors',
        active ? 'text-fg' : 'text-fg-muted hover:text-fg',
        align === 'end' && 'flex-row-reverse',
      )}
    >
      {label}
      <Icon
        aria-hidden
        className={cn('size-3', active ? 'opacity-100' : 'opacity-30 group-hover:opacity-70')}
      />
    </Link>
  );
}

/**
 * Offset pager — "21-40 / 137". The count is the point: the old tables either
 * fetched everything or silently truncated at 50 rows with nothing on screen
 * admitting it, so records past the cut were simply unreachable.
 */
export function Pager({
  offset,
  limit,
  total,
  hrefForOffset,
  label = 'records',
}: {
  offset: number;
  limit: number;
  total: number;
  hrefForOffset: (offset: number) => string;
  label?: string;
}) {
  if (total === 0) return null;
  const from = offset + 1;
  const to = Math.min(offset + limit, total);
  const prev = offset > 0 ? Math.max(0, offset - limit) : undefined;
  const next = to < total ? offset + limit : undefined;

  return (
    <div className="text-fg-muted flex items-center justify-end gap-2 py-1.5 text-[12px]">
      <span className="tabular-nums">
        {from}-{to} / {total} {label}
      </span>
      <div className="flex items-center gap-1">
        <OffsetLink
          href={prev === undefined ? undefined : hrefForOffset(prev)}
          label={`Previous ${limit} ${label}`}
        >
          Previous
        </OffsetLink>
        <OffsetLink
          href={next === undefined ? undefined : hrefForOffset(next)}
          label={`Next ${limit} ${label}`}
        >
          Next
        </OffsetLink>
      </div>
    </div>
  );
}

function OffsetLink({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: ReactNode;
}) {
  const shape = 'rounded-control border border-border px-2 py-0.5';
  if (!href) {
    return (
      <span aria-hidden className={cn(shape, 'text-fg-subtle opacity-40')}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={label}
      className={cn(shape, 'text-fg-muted hover:bg-surface-sunken hover:text-fg no-underline')}
    >
      {children}
    </Link>
  );
}
