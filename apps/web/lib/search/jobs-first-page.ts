import { headers } from 'next/headers';
import { tags } from '@/lib/cache';
import { clientIp } from '@/lib/security/client-ip';
import { searchLimit } from '@/lib/ratelimit';
import type { JobCardRecord, JobSearchPage } from '@/lib/search/job-search-query';
import {
  SearchQuery,
  isDefaultSearch,
  searchJobs,
  type JobSearchInput,
  type JobSearchResult,
} from '@/lib/search/jobs';

// The first page of /jobs, run on the server so the listing is part of the
// HTML. Everything here degrades to `null` — the client then fetches the page
// itself, exactly as it did before this existed — so a slow or failing backend
// can make the first paint no better, never worse.

/**
 * How long the server render will wait for results before giving up and
 * leaving the client to fetch them. The skeleton is on screen for this long, so
 * it is the same wait the visitor had before — bounded rather than open-ended.
 */
export const SSR_BUDGET_MS = 3_000;

/**
 * The card shows the first 150 characters of the description and adds an
 * ellipsis when there is more, so 151 is the most it can ever use. Everything
 * the server hands to a client component is serialised into the page, and a
 * full job description is kilobytes; twenty of them is the page's largest blob.
 */
export const CARD_EXCERPT_CHARS = 151;

export function toCardRecord(hit: JobSearchResult['hits'][number]): JobCardRecord {
  return {
    objectID: hit.objectID,
    slug: hit.slug,
    title: hit.title,
    description: (hit.description ?? '').slice(0, CARD_EXCERPT_CHARS),
    companyName: hit.companyName,
    companyLogoUrl: hit.companyLogoUrl,
    location: hit.location,
    workMode: hit.workMode,
    salaryMin: hit.salaryMin,
    salaryMax: hit.salaryMax,
    salaryCurrency: hit.salaryCurrency,
    salaryPeriod: hit.salaryPeriod,
    publishedAt: hit.publishedAt,
    skills: hit.skills,
  };
}

/**
 * The unfiltered first page. It is identical for every visitor (no query, no
 * location, so no per-IP geo), which makes it cacheable across them: a request
 * for plain /jobs costs no search at all. Invalidated with the `jobs` tag that
 * publish / unpublish / close already update.
 *
 * Only this one query is cached on purpose. A cache entry per arbitrary
 * `?q=` would let anyone fill the cache with one-off keys.
 */
export async function getDefaultJobsPage(): Promise<JobSearchPage> {
  'use cache';
  const { cacheTag, cacheLife } = await import('next/cache');
  cacheTag(tags.jobs());
  cacheLife('minutes');

  const r = await searchJobs(SearchQuery.parse({}));
  return { hits: r.hits.map(toCardRecord), nbHits: r.nbHits, page: r.page, nbPages: r.nbPages };
}

/** Resolves to `null` if `p` has not settled in `ms` (or rejects). Never rejects. */
async function within<T>(p: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const settled = p.catch(() => null);
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([settled, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function liveFirstPage(input: JobSearchInput): Promise<JobSearchPage | null> {
  const ip = clientIp(await headers());
  // The same ceiling the API route applies: a server render that runs a search
  // is as much a search as the fetch would have been, and the Postgres fallback
  // is the expensive path. Over the limit the page simply renders without
  // results and the client's own request meets the same limiter.
  const { success } = await searchLimit(ip ?? 'unknown');
  if (!success) return null;

  const r = await within(searchJobs(input, { ip }), SSR_BUDGET_MS);
  return r
    ? { hits: r.hits.map(toCardRecord), nbHits: r.nbHits, page: r.page, nbPages: r.nbPages }
    : null;
}

/**
 * Results for the canonical query string `qs`, or `null` when the server
 * should not (or could not) provide them.
 */
export async function loadFirstPage(qs: string): Promise<JobSearchPage | null> {
  try {
    const parsed = SearchQuery.safeParse(Object.fromEntries(new URLSearchParams(qs)));
    if (!parsed.success) return null;
    if (isDefaultSearch(parsed.data)) return await within(getDefaultJobsPage(), SSR_BUDGET_MS);
    return await liveFirstPage(parsed.data);
  } catch {
    return null;
  }
}
