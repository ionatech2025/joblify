import type { JobSearchRecord } from './algolia';

// Pure, dependency-free helpers shared by the /jobs server render and the
// client search UI. Nothing here imports Algolia's client, Prisma or zod, so
// the client bundle can use it without pulling any of them in (JobSearchRecord
// is a type-only import).

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** One page of results, as both /api/v1/jobs/search and the server render produce it. */
export type JobSearchPage = {
  hits: JobCardRecord[];
  nbHits: number;
  page: number;
  nbPages: number;
};

/**
 * The fields a result card renders. The API returns the full search record (a
 * superset of this), so the same type describes both responses; the server
 * render hands the client only these, because everything it passes becomes
 * part of the page's flight payload.
 */
export type JobCardRecord = Pick<
  JobSearchRecord,
  | 'objectID'
  | 'slug'
  | 'title'
  | 'description'
  | 'companyName'
  | 'companyLogoUrl'
  | 'location'
  | 'workMode'
  | 'salaryMin'
  | 'salaryMax'
  | 'salaryCurrency'
  | 'salaryPeriod'
  | 'publishedAt'
  | 'skills'
>;

/**
 * A search's identity, independent of how the URL happened to be written.
 *
 * `?q=react&sort=recent`, `?sort=recent&q=react` and `?q=react&sort=recent&page=0`
 * are the same search. The server render and the client query hook both key
 * off this string, so a page rendered on the server for one spelling is
 * recognised as the data for the other instead of being thrown away and
 * fetched again.
 */
export function canonicalSearchString(
  input: URLSearchParams | RawSearchParams | string = '',
): string {
  let params: URLSearchParams;
  if (input instanceof URLSearchParams) {
    params = input;
  } else if (typeof input === 'string') {
    params = new URLSearchParams(input);
  } else {
    params = new URLSearchParams();
    for (const [k, raw] of Object.entries(input)) {
      for (const v of Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]) {
        params.append(k, v);
      }
    }
  }

  const entries: Array<[string, string]> = [];
  for (const [k, v] of params) {
    if (v === '') continue;
    // The first page is the default; spelling it out is noise.
    if (k === 'page' && v === '0') continue;
    entries.push([k, v]);
  }
  entries.sort(([ak, av], [bk, bv]) =>
    ak < bk ? -1 : ak > bk ? 1 : av < bv ? -1 : av > bv ? 1 : 0,
  );
  return new URLSearchParams(entries).toString();
}
