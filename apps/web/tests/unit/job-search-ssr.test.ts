import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// The /jobs server render: the first page of results is looked up on the
// server so the listing is in the HTML. Every failure mode must come back as
// `null` (the client then fetches the page itself, as it always did) — never
// as a thrown error that takes the page down.

const m = vi.hoisted(() => ({
  searchLimit: vi.fn(),
  search: vi.fn(),
  jobPostFindMany: vi.fn(),
  jobPostCount: vi.fn(),
  headers: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: m.headers }));
vi.mock('next/cache', () => ({ cacheTag: m.cacheTag, cacheLife: m.cacheLife }));
vi.mock('@/lib/ratelimit', () => ({ searchLimit: m.searchLimit }));
vi.mock('@/lib/search/algolia', () => ({
  searchClient: () => ({ search: m.search }),
  INDEX: { jobs: 'jobs', jobsRecent: 'jobs_recent', jobsSalaryDesc: 'jobs_salary_desc' },
}));
vi.mock('@/lib/db', () => ({
  db: { jobPost: { findMany: m.jobPostFindMany, count: m.jobPostCount } },
}));

import {
  CARD_EXCERPT_CHARS,
  SSR_BUDGET_MS,
  loadFirstPage,
  toCardRecord,
} from '@/lib/search/jobs-first-page';

const record = (over: Record<string, unknown> = {}) => ({
  objectID: 'job_1',
  slug: 'senior-engineer',
  title: 'Senior Engineer',
  description: 'x'.repeat(5_000),
  companyId: 'co_1',
  companyName: 'Acme',
  companyLogoUrl: null,
  industry: 'TECH',
  jobType: 'FULL_TIME',
  experienceLevel: 'SENIOR',
  workMode: 'REMOTE',
  location: 'Kampala',
  salaryMin: 1,
  salaryMax: 2,
  salaryCurrency: 'USD',
  salaryPeriod: 'YEAR',
  salaryAnnualMin: 1,
  salaryAnnualMax: 2,
  publishedAt: 1_700_000_000_000,
  skills: ['react'],
  _geoloc: { lat: 0, lng: 0 },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  m.headers.mockResolvedValue(new Headers({ 'x-forwarded-for': '203.0.113.7' }));
  m.searchLimit.mockResolvedValue({ success: true });
  m.search.mockResolvedValue({
    results: [{ hits: [record()], nbHits: 1, page: 0, nbPages: 1 }],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('loadFirstPage', () => {
  it('returns the first page for a filtered search, trimmed to what a card renders', async () => {
    const page = await loadFirstPage('q=react&workMode=REMOTE');

    expect(page).not.toBeNull();
    expect(page!.nbHits).toBe(1);
    const [hit] = page!.hits;
    expect(hit!.description).toHaveLength(CARD_EXCERPT_CHARS);
    // Fields the card never reads are not serialised into the page.
    expect(hit).not.toHaveProperty('companyId');
    expect(hit).not.toHaveProperty('_geoloc');
    expect(hit).not.toHaveProperty('salaryAnnualMax');
    expect(hit).toMatchObject({ slug: 'senior-engineer', title: 'Senior Engineer' });
  });

  it('searches as the visitor: their IP is forwarded and rate-limited on', async () => {
    await loadFirstPage('q=react');
    expect(m.searchLimit).toHaveBeenCalledWith('203.0.113.7');
    expect(m.search.mock.calls[0]![1]).toEqual({ headers: { 'X-Forwarded-For': '203.0.113.7' } });
  });

  it('serves the unfiltered first page from the cache path, without spending a rate-limit token', async () => {
    const page = await loadFirstPage('');
    expect(page).not.toBeNull();
    expect(m.searchLimit).not.toHaveBeenCalled();
    expect(m.cacheTag).toHaveBeenCalledWith('jobs');
    expect(m.cacheLife).toHaveBeenCalledWith('minutes');
  });

  it('treats a spelled-out first page as the default search', async () => {
    await loadFirstPage('page=0');
    expect(m.searchLimit).not.toHaveBeenCalled();
    expect(m.cacheTag).toHaveBeenCalled();
  });

  it('does not run a search for parameters the API would reject', async () => {
    expect(await loadFirstPage('page=-5&sort=%00')).toBeNull();
    expect(await loadFirstPage(`q=${'a'.repeat(301)}`)).toBeNull();
    expect(m.search).not.toHaveBeenCalled();
    expect(m.jobPostFindMany).not.toHaveBeenCalled();
  });

  it('renders without results when the visitor is over the search rate limit', async () => {
    m.searchLimit.mockResolvedValue({ success: false });
    expect(await loadFirstPage('q=react')).toBeNull();
    expect(m.search).not.toHaveBeenCalled();
  });

  it('falls back to Postgres when Algolia is down, like the API does', async () => {
    m.search.mockRejectedValue(new Error('algolia down'));
    m.jobPostFindMany.mockResolvedValue([]);
    m.jobPostCount.mockResolvedValue(0);
    const page = await loadFirstPage('q=react');
    expect(page).toEqual({ hits: [], nbHits: 0, page: 0, nbPages: 0 });
  });

  it('returns null, not an error, when no backend can answer', async () => {
    m.search.mockRejectedValue(new Error('algolia down'));
    m.jobPostFindMany.mockRejectedValue(new Error('db down'));
    m.jobPostCount.mockRejectedValue(new Error('db down'));
    await expect(loadFirstPage('q=react')).resolves.toBeNull();
  });

  it('gives up after the render budget instead of holding the stream open', async () => {
    vi.useFakeTimers();
    m.search.mockReturnValue(new Promise(() => {}));
    const pending = loadFirstPage('q=react');
    await vi.advanceTimersByTimeAsync(SSR_BUDGET_MS + 1);
    await expect(pending).resolves.toBeNull();
  });
});

describe('toCardRecord', () => {
  it('keeps a short description whole', () => {
    expect(toCardRecord(record({ description: 'short' })).description).toBe('short');
  });

  it('renders the same card text as the untrimmed description would', () => {
    // The card shows slice(0, 150) and appends an ellipsis only when the text
    // is longer; one extra character is all it needs to know that.
    const long = 'y'.repeat(400);
    const card = toCardRecord(record({ description: long }));
    expect(card.description.slice(0, 150)).toBe(long.slice(0, 150));
    expect(card.description.length > 150).toBe(long.length > 150);
  });

  it('tolerates a record with no description', () => {
    expect(toCardRecord(record({ description: undefined })).description).toBe('');
  });
});
