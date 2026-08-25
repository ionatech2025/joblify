import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, makeHref, orderParam, readListQuery } from '@/lib/ui/list-params';

const SORTABLE = ['title', 'applicants', 'posted'] as const;
const VIEWS = ['list', 'kanban'] as const;
const OPTS = {
  defaultSort: { key: 'posted', dir: 'desc' } as const,
  sortable: SORTABLE,
  views: VIEWS,
};

describe('readListQuery', () => {
  it('falls back to the defaults when nothing is set', () => {
    const q = readListQuery(new URLSearchParams(), OPTS);
    expect(q).toEqual({
      q: '',
      sort: { key: 'posted', dir: 'desc' },
      offset: 0,
      limit: DEFAULT_LIMIT,
      view: 'list',
    });
  });

  it('reads an allow-listed order key and direction', () => {
    const q = readListQuery(new URLSearchParams('order=title:asc'), OPTS);
    expect(q.sort).toEqual({ key: 'title', dir: 'asc' });
  });

  it('ignores an order key that is not on the allow-list', () => {
    // The value arrives straight off the URL and is interpolated into a Prisma
    // orderBy — an unrecognised key must never reach it.
    const q = readListQuery(new URLSearchParams('order=id;DROP TABLE:asc'), OPTS);
    expect(q.sort).toEqual(OPTS.defaultSort);
  });

  it('defaults a malformed direction to desc rather than dropping the sort', () => {
    expect(readListQuery(new URLSearchParams('order=title:sideways'), OPTS).sort).toEqual({
      key: 'title',
      dir: 'desc',
    });
  });

  it('snaps offset to a page boundary and floors junk to zero', () => {
    expect(readListQuery(new URLSearchParams('offset=40'), OPTS).offset).toBe(40);
    // 47 would otherwise produce a window overlapping the previous page.
    expect(readListQuery(new URLSearchParams('offset=47'), OPTS).offset).toBe(40);
    expect(readListQuery(new URLSearchParams('offset=-10'), OPTS).offset).toBe(0);
    expect(readListQuery(new URLSearchParams('offset=abc'), OPTS).offset).toBe(0);
    expect(readListQuery(new URLSearchParams('offset=1e9999'), OPTS).offset).toBe(0);
  });

  it('honours a custom limit when snapping', () => {
    expect(readListQuery(new URLSearchParams('offset=17'), { ...OPTS, limit: 5 }).offset).toBe(15);
  });

  it('only accepts a known view', () => {
    expect(readListQuery(new URLSearchParams('view=kanban'), OPTS).view).toBe('kanban');
    expect(readListQuery(new URLSearchParams('view=pivot'), OPTS).view).toBe('list');
  });

  it('trims the search text', () => {
    expect(readListQuery(new URLSearchParams('q=  senior  '), OPTS).q).toBe('senior');
  });

  it('accepts a plain searchParams object as well as URLSearchParams', () => {
    // Next hands `searchParams` over as a plain object, sometimes with arrays.
    const q = readListQuery({ order: ['title:asc'], q: 'react', view: undefined }, OPTS);
    expect(q.sort).toEqual({ key: 'title', dir: 'asc' });
    expect(q.q).toBe('react');
    expect(q.view).toBe('list');
  });
});

describe('makeHref', () => {
  it('returns the bare path when no params remain', () => {
    expect(makeHref('/company/jobs', new URLSearchParams())({})).toBe('/company/jobs');
  });

  it('sets and removes params', () => {
    const href = makeHref('/company/jobs', new URLSearchParams('q=react&status=DRAFT'));
    expect(href({ status: null })).toBe('/company/jobs?q=react');
    expect(href({ q: 'go' })).toBe('/company/jobs?q=go&status=DRAFT');
  });

  it('treats an empty string as a removal', () => {
    expect(makeHref('/x', new URLSearchParams('q=react'))({ q: '' })).toBe('/x');
  });

  it('resets offset for any patch that is not an offset change', () => {
    const href = makeHref('/company/jobs', new URLSearchParams('offset=40&q=react'));
    // Re-sorting from page 3 must not land on a page-3 window of a differently
    // sized result set — that reads to the user as an empty table.
    expect(href({ order: 'title:asc' })).toBe('/company/jobs?order=title%3Aasc&q=react');
  });

  it('keeps offset when offset is what changed', () => {
    const href = makeHref('/company/jobs', new URLSearchParams('offset=40&q=react'));
    expect(href({ offset: 60 })).toBe('/company/jobs?offset=60&q=react');
  });

  it('drops a zero offset rather than writing it out', () => {
    const href = makeHref('/company/jobs', new URLSearchParams('offset=40'));
    expect(href({ offset: 0 })).toBe('/company/jobs');
  });

  it('emits params in a stable order regardless of patch order', () => {
    const a = makeHref('/x', new URLSearchParams())({ view: 'kanban', order: 'title:asc' });
    const b = makeHref('/x', new URLSearchParams())({ order: 'title:asc', view: 'kanban' });
    expect(a).toBe(b);
    expect(a).toBe('/x?order=title%3Aasc&view=kanban');
  });

  it('ignores empty values in a plain object base', () => {
    expect(makeHref('/x', { q: '', status: 'DRAFT' })({})).toBe('/x?status=DRAFT');
  });
});

describe('orderParam', () => {
  it('joins key and direction', () => {
    expect(orderParam('title', 'asc')).toBe('title:asc');
  });
});
