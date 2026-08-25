import type { ListSort, SortDir } from '@/app/components/console/list-view';

/**
 * URL-state parsing and href building for console list views.
 *
 * Every console list keeps its query — search text, sort, page, which view —
 * in the URL, so a view is shareable, survives a refresh, and works with the
 * back button. That convention already existed on two surfaces
 * (`jobs-search.tsx`, the applicants board) with two hand-rolled
 * implementations; this is the single one they all use, so an out-of-range
 * `offset` or an unvalidated `order` can't be reintroduced per page.
 *
 * Everything here is pure and synchronous, which is what lets the list views
 * stay server components.
 */

export type ListQuery = {
  /** Free-text search, trimmed. Empty string when absent. */
  q: string;
  sort: ListSort;
  offset: number;
  limit: number;
  view: string;
};

export const DEFAULT_LIMIT = 20;

/**
 * Reads a validated list query out of raw search params.
 *
 * `sortable` and `views` are allow-lists: an `order` or `view` value the page
 * doesn't recognise falls back to the default rather than reaching a Prisma
 * `orderBy` or a component switch. That matters because these values arrive
 * straight off the URL — `?order=id;DROP` must be inert, not a 500.
 */
export function readListQuery(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  opts: {
    defaultSort: ListSort;
    sortable: readonly string[];
    limit?: number;
    views?: readonly string[];
    defaultView?: string;
  },
): ListQuery {
  const get = (key: string): string => {
    if (params instanceof URLSearchParams) return params.get(key) ?? '';
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw) ?? '';
  };

  const limit = opts.limit ?? DEFAULT_LIMIT;

  // `order` is a single param, "key:dir", so one link can change both without
  // leaving a stale direction behind when the column changes.
  const [rawKey, rawDir] = get('order').split(':');
  const sort: ListSort =
    rawKey && opts.sortable.includes(rawKey)
      ? { key: rawKey, dir: rawDir === 'asc' ? 'asc' : 'desc' }
      : opts.defaultSort;

  const parsedOffset = Number.parseInt(get('offset'), 10);
  // NaN, negatives and fractional offsets all collapse to page 1, and the
  // offset is snapped to a page boundary so `?offset=7` can't produce a window
  // that overlaps the previous page.
  const offset =
    Number.isFinite(parsedOffset) && parsedOffset > 0
      ? Math.floor(parsedOffset / limit) * limit
      : 0;

  const rawView = get('view');
  const view =
    opts.views && opts.views.includes(rawView)
      ? rawView
      : (opts.defaultView ?? opts.views?.[0] ?? 'list');

  return { q: get('q').trim(), sort, offset, limit, view };
}

/** Value types a patch may set. `null` removes the param. */
type PatchValue = string | number | null | undefined;

/**
 * Builds `path?…` hrefs by patching the current params.
 *
 * Any patch that is not itself an `offset` change **resets `offset`**. That is
 * the fix for a whole class of paging bug: re-sorting or dropping a facet while
 * on page 4 otherwise lands on a page-4 window of a differently-sized result
 * set, which reads as an empty table.
 */
export function makeHref(
  path: string,
  current: URLSearchParams | Record<string, string | string[] | undefined>,
) {
  const base = new URLSearchParams();
  if (current instanceof URLSearchParams) {
    for (const [k, v] of current) base.set(k, v);
  } else {
    for (const [k, raw] of Object.entries(current)) {
      const v = Array.isArray(raw) ? raw[0] : raw;
      if (v != null && v !== '') base.set(k, v);
    }
  }

  return (patch: Record<string, PatchValue>): string => {
    const next = new URLSearchParams(base);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') next.delete(k);
      else next.set(k, String(v));
    }
    if (!('offset' in patch)) next.delete('offset');
    // A default-valued param is noise in a shared link.
    if (next.get('offset') === '0') next.delete('offset');

    // Stable key order keeps hrefs (and therefore Next's client cache keys and
    // any snapshot test) deterministic regardless of patch order.
    const sorted = new URLSearchParams([...next].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
    const qs = sorted.toString();
    return qs ? `${path}?${qs}` : path;
  };
}

/** `order` param value for a column + direction. */
export function orderParam(key: string, dir: SortDir): string {
  return `${key}:${dir}`;
}
