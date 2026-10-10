import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { searchClient, INDEX, type JobSearchRecord } from '@/lib/search/algolia';
import { salaryOverlapWhere } from '@/lib/search/salary';
import { db } from '@/lib/db';

// The job search itself, shared by GET /api/v1/jobs/search (client-side
// filtering) and the /jobs server render (the first page, so the listing is in
// the HTML rather than behind a JS download + hydrate + fetch). Both must give
// the same answer for the same query, which is why there is one copy.

export type JobSearchResult = {
  hits: JobSearchRecord[];
  nbHits: number;
  page: number;
  nbPages: number;
};

const HITS_PER_PAGE = 20;

const SORT_INDEX: Record<string, string> = {
  recent: INDEX.jobsRecent,
  salary: INDEX.jobsSalaryDesc,
};

// Bounds + whitelists every param before it reaches the Algolia query builder —
// previously `q` had no length cap and salary/page/radius went through bare
// Number() coercion, so a malformed value silently produced a broken filter
// string (or NaN) instead of a clear 400.
export const SearchQuery = z.object({
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

export type JobSearchInput = z.infer<typeof SearchQuery>;

/** Neither Algolia nor the Postgres fallback could answer. `cause` is the first failure. */
export class SearchUnavailableError extends Error {
  constructor(cause: unknown) {
    super('search backend unavailable', { cause });
    this.name = 'SearchUnavailableError';
  }
}

/** True when the input is the unfiltered, relevance-ordered first page — the same for every visitor. */
export function isDefaultSearch(input: JobSearchInput): boolean {
  return (
    !input.q &&
    !input.location &&
    !input.workMode &&
    !input.jobType &&
    !input.experienceLevel &&
    input.salaryMin == null &&
    input.salaryMax == null &&
    input.radiusKm == null &&
    !input.sort &&
    input.page === 0
  );
}

/**
 * Runs a search: Algolia first (with the sort replica when one is asked for,
 * degrading to relevance when the replica is not configured yet), then the
 * Postgres fallback when Algolia is unconfigured or unavailable.
 *
 * `ip` is the visitor's address. Algolia's `aroundLatLngViaIP` resolves the
 * location of whoever it sees on the connection, which from a serverless
 * function is a datacenter — X-Forwarded-For makes it the visitor.
 */
export async function searchJobs(
  input: JobSearchInput,
  opts: { ip?: string | null } = {},
): Promise<JobSearchResult> {
  const { q, location, workMode, jobType, experienceLevel, salaryMin, salaryMax, radiusKm, sort } =
    input;
  const { page } = input;
  const ip = opts.ip ?? null;

  const filters: string[] = [];
  if (workMode) filters.push(`workMode:${workMode}`);
  if (jobType) filters.push(`jobType:${jobType}`);
  if (experienceLevel) filters.push(`experienceLevel:${experienceLevel}`);
  // Bracket overlapping salary bands: the job's range must intersect the
  // user's. Compared on the ANNUALISED fields — raw salaryMin/Max are in
  // whatever period the employer chose, and are not comparable to each other.
  if (salaryMin != null) filters.push(`salaryAnnualMax >= ${salaryMin}`);
  if (salaryMax != null) filters.push(`salaryAnnualMin <= ${salaryMax}`);

  const buildRequest = (indexName: string) => ({
    indexName,
    query: q,
    filters: filters.join(' AND ') || undefined,
    page,
    hitsPerPage: HITS_PER_PAGE,
    aroundLatLngViaIP: !!location,
    aroundRadius: radiusKm ? radiusKm * 1000 : undefined,
  });

  async function run(indexName: string): Promise<JobSearchResult> {
    // X-Forwarded-For makes `aroundLatLngViaIP` resolve the *visitor's*
    // location. Called from a Server Function, Algolia would otherwise see the
    // datacenter's address and centre every "near me" search there.
    const res = await searchClient().search<JobSearchRecord>(
      { requests: [buildRequest(indexName)] },
      ip ? { headers: { 'X-Forwarded-For': ip } } : undefined,
    );
    return res.results[0] as JobSearchResult;
  }

  const chosen = sort ? SORT_INDEX[sort] : undefined;

  try {
    let r: JobSearchResult;
    try {
      r = await run(chosen ?? INDEX.jobs);
    } catch (replicaErr) {
      // The sort replica may not be configured yet — degrade to relevance.
      if (chosen && chosen !== INDEX.jobs) r = await run(INDEX.jobs);
      else throw replicaErr;
    }
    return { hits: r.hits, nbHits: r.nbHits, page: r.page, nbPages: r.nbPages };
  } catch (err) {
    // Fallback to Postgres search when Algolia is unconfigured or unavailable
    try {
      const where: Prisma.JobPostWhereInput = {
        status: 'PUBLISHED',
        deletedAt: null,
        company: { deletedAt: null },
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                {
                  company: {
                    companyProfile: { companyName: { contains: q, mode: 'insensitive' } },
                  },
                },
              ],
            }
          : {}),
        ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
        ...(workMode ? { workMode } : {}),
        ...(jobType ? { jobType } : {}),
        ...(experienceLevel ? { experienceLevel } : {}),
        ...(salaryOverlapWhere(salaryMin, salaryMax) ?? {}),
      };

      const orderBy: Prisma.JobPostOrderByWithRelationInput =
        sort === 'salary' ? { salaryMax: 'desc' } : { publishedAt: 'desc' };
      // Known limit of the fallback: "highest salary" orders by the stored
      // figure, so mixed pay periods are not strictly comparable here. The
      // Algolia path sorts on salaryAnnualMax.

      const [jobs, total] = await Promise.all([
        db.jobPost.findMany({
          where,
          include: {
            company: { include: { companyProfile: true } },
            skills: { include: { skill: true } },
          },
          orderBy,
          skip: page * HITS_PER_PAGE,
          take: HITS_PER_PAGE,
        }),
        db.jobPost.count({ where }),
      ]);

      const hits: JobSearchRecord[] = jobs.map((j) => ({
        objectID: j.id,
        slug: j.slug,
        title: j.title,
        description: j.description,
        companyId: j.companyId,
        companyName: j.company.companyProfile?.companyName ?? 'Company',
        companyLogoUrl: j.company.companyProfile?.logoUrl ?? null,
        industry: j.company.companyProfile?.industry ?? '',
        jobType: j.jobType,
        experienceLevel: j.experienceLevel,
        workMode: j.workMode,
        location: j.location,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        salaryCurrency: j.salaryCurrency,
        salaryPeriod: j.salaryPeriod,
        publishedAt: (j.publishedAt ?? j.createdAt).getTime(),
        skills: j.skills.map((s) => s.skill.slug),
      }));

      return { hits, nbHits: total, page, nbPages: Math.ceil(total / HITS_PER_PAGE) };
    } catch {
      throw new SearchUnavailableError(err);
    }
  }
}
