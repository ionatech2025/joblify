import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Control-panel search box. A plain GET form, not a debounced client input:
 * every other filter on these surfaces is already URL state, and a form
 * submission is the one interaction that needs no JavaScript at all. The
 * caller passes `preserve` so submitting a search keeps the active filters,
 * sort and view instead of resetting the whole view to defaults — but drops
 * `offset`, since a new query has no page 3.
 */
export function SearchBox({
  action,
  name = 'q',
  defaultValue = '',
  placeholder = 'Search…',
  preserve,
  className,
}: {
  /** Path to submit to — the current route. */
  action: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  /** Params to carry through the submission, as [key, value] pairs. */
  preserve?: [string, string][];
  className?: string;
}) {
  return (
    <form
      method="get"
      action={action}
      role="search"
      className={cn(
        'border-border bg-surface focus-within:border-brand focus-within:ring-brand/25 rounded-control flex min-w-0 items-center gap-1.5 border pl-2 transition-colors focus-within:ring-2',
        className,
      )}
    >
      {preserve?.map(([k, v]) => (
        <input key={`${k}=${v}`} type="hidden" name={k} value={v} />
      ))}
      <Search aria-hidden className="text-fg-subtle size-3.5 shrink-0" />
      <input
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="text-fg placeholder:text-fg-subtle w-full min-w-0 bg-transparent py-1 pr-2 text-[13px] outline-none"
      />
    </form>
  );
}

export type Facet = {
  /** Dimension name shown in the chip's darker leading segment. */
  group: string;
  /** The selected value. */
  label: string;
  /** URL with this one facet removed. */
  removeHref: string;
};

/**
 * Active-filter facets — the Odoo searchview's defining feature. Every filter
 * currently narrowing the view is a chip you can see and remove one at a time.
 *
 * The surfaces this replaces expressed their filters as `<select>`s and toggle
 * tabs whose state you could only read by looking at each control in turn, and
 * with no way to clear them all. A chip row is the whole query, stated once.
 */
export function FacetChips({
  facets,
  clearHref,
  className,
}: {
  facets: Facet[];
  /** Shown as "Clear all" once more than one facet is active. */
  clearHref?: string;
  className?: string;
}) {
  if (facets.length === 0) return null;
  return (
    <div
      aria-label="Active filters"
      className={cn('flex flex-wrap items-center gap-1.5', className)}
    >
      {facets.map((f) => (
        <span
          key={`${f.group}:${f.label}`}
          className="border-brand/30 bg-brand-subtle text-brand-subtle-fg rounded-control inline-flex items-center overflow-hidden border text-[12px]"
        >
          <span className="border-brand/25 border-r px-1.5 py-0.5 font-semibold">{f.group}</span>
          <span className="px-1.5 py-0.5">{f.label}</span>
          <Link
            href={f.removeHref}
            scroll={false}
            aria-label={`Remove ${f.group} filter: ${f.label}`}
            className="hover:bg-brand/15 grid size-5 place-items-center no-underline transition-colors"
          >
            <X aria-hidden className="size-3" />
          </Link>
        </span>
      ))}
      {facets.length > 1 && clearHref ? (
        <Link
          href={clearHref}
          scroll={false}
          className="text-fg-muted hover:text-fg text-[12px] underline"
        >
          Clear all
        </Link>
      ) : null}
    </div>
  );
}
