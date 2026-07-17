import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { adminClient, INDEX, type JobSearchRecord } from '@/lib/search/algolia';
import { searchLimit } from '@/lib/ratelimit';

type AlgoliaPage = { hits: JobSearchRecord[]; nbHits: number; page: number; nbPages: number };

const SORT_INDEX: Record<string, string> = {
  recent: INDEX.jobsRecent,
  salary: INDEX.jobsSalaryDesc,
};

// Bounds + whitelists every param before it reaches the Algolia query builder —
// previously `q` had no length cap and salary/page/radius went through bare
// Number() coercion, so a malformed value silently produced a broken filter
// string (or NaN) instead of a clear 400.
const SearchQuery = z.object({
  q: z.string().trim().max(300).optional().default(''),
  location: z.string().trim().max(200).optional().default(''),
  workMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY']).optional(),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'STAFF', 'EXECUTIVE']).optional(),
  salaryMin: z.coerce.number().int().min(0).max(10_000_000).optional(),
  salaryMax: z.coerce.number().int().min(0).max(10_000_000).optional(),
  radiusKm: z.coerce.number().positive().max(20_000).optional(),
  sort: z.enum(['recent', 'salary']).optional(),
  page: z.coerce.number().int().min(0).max(1000).default(0),
});

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success } = await searchLimit(ip);
  if (!success) return NextResponse.json({ error: 'rate-limited' }, { status: 429 });

  const url = new URL(req.url);
  const parsed = SearchQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid search parameters' }, { status: 400 });
  }
  const { q, location, workMode, jobType, experienceLevel, salaryMin, salaryMax, radiusKm, sort, page } = parsed.data;

  const filters: string[] = [];
  if (workMode) filters.push(`workMode:${workMode}`);
  if (jobType) filters.push(`jobType:${jobType}`);
  if (experienceLevel) filters.push(`experienceLevel:${experienceLevel}`);
  // Bracket overlapping salary bands: the job's range must intersect the user's.
  if (salaryMin != null) filters.push(`salaryMax >= ${salaryMin}`);
  if (salaryMax != null) filters.push(`salaryMin <= ${salaryMax}`);

  const buildRequest = (indexName: string) => ({
    indexName,
    query: q,
    filters: filters.join(' AND ') || undefined,
    page,
    hitsPerPage: 20,
    aroundLatLngViaIP: !!location,
    aroundRadius: radiusKm ? radiusKm * 1000 : undefined,
  });

  async function run(indexName: string): Promise<AlgoliaPage> {
    const res = await adminClient().search<JobSearchRecord>({ requests: [buildRequest(indexName)] });
    return res.results[0] as AlgoliaPage;
  }

  const chosen = sort ? SORT_INDEX[sort] : undefined;

  try {
    let r: AlgoliaPage;
    try {
      r = await run(chosen ?? INDEX.jobs);
    } catch (replicaErr) {
      // The sort replica may not be configured yet — degrade to relevance.
      if (chosen && chosen !== INDEX.jobs) r = await run(INDEX.jobs);
      else throw replicaErr;
    }
    return NextResponse.json({ hits: r.hits, nbHits: r.nbHits, page: r.page, nbPages: r.nbPages });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'search backend unavailable',
        detail: process.env.NODE_ENV === 'development' ? String(err) : undefined,
      },
      { status: 502 },
    );
  }
}
