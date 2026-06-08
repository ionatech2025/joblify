import { NextResponse, type NextRequest } from 'next/server';
import { adminClient, INDEX, type JobSearchRecord } from '@/lib/search/algolia';
import { searchLimit } from '@/lib/ratelimit';

type AlgoliaPage = { hits: JobSearchRecord[]; nbHits: number; page: number; nbPages: number };

const SORT_INDEX: Record<string, string> = {
  recent: INDEX.jobsRecent,
  salary: INDEX.jobsSalaryDesc,
};

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success } = await searchLimit(ip);
  if (!success) return NextResponse.json({ error: 'rate-limited' }, { status: 429 });

  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  const location = url.searchParams.get('location');
  const workMode = url.searchParams.get('workMode');
  const jobType = url.searchParams.get('jobType');
  const experienceLevel = url.searchParams.get('experienceLevel');
  const salaryMin = url.searchParams.get('salaryMin');
  const salaryMax = url.searchParams.get('salaryMax');
  const radiusKm = url.searchParams.get('radiusKm');
  const sort = url.searchParams.get('sort') ?? '';
  const page = Number(url.searchParams.get('page') ?? '0') || 0;

  const filters: string[] = [];
  if (workMode) filters.push(`workMode:${workMode}`);
  if (jobType) filters.push(`jobType:${jobType}`);
  if (experienceLevel) filters.push(`experienceLevel:${experienceLevel}`);
  // Bracket overlapping salary bands: the job's range must intersect the user's.
  if (salaryMin) filters.push(`salaryMax >= ${Number(salaryMin)}`);
  if (salaryMax) filters.push(`salaryMin <= ${Number(salaryMax)}`);

  const buildRequest = (indexName: string) => ({
    indexName,
    query: q,
    filters: filters.join(' AND ') || undefined,
    page,
    hitsPerPage: 20,
    aroundLatLngViaIP: !!location,
    aroundRadius: radiusKm ? Number(radiusKm) * 1000 : undefined,
  });

  async function run(indexName: string): Promise<AlgoliaPage> {
    const res = await adminClient().search<JobSearchRecord>({ requests: [buildRequest(indexName)] });
    return res.results[0] as AlgoliaPage;
  }

  const chosen = SORT_INDEX[sort] ?? INDEX.jobs;

  try {
    let r: AlgoliaPage;
    try {
      r = await run(chosen);
    } catch (replicaErr) {
      // The sort replica may not be configured yet — degrade to relevance.
      if (chosen !== INDEX.jobs) r = await run(INDEX.jobs);
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
