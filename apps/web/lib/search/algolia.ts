import { algoliasearch } from 'algoliasearch';
import type { JobPost, CompanyProfile, User } from '@prisma/client';
import { toAnnual } from './salary';

// Algolia's Build plan caps a record at 10 KB. A job description is searchable
// text, not display text (result cards do not render it), so a bounded excerpt
// keeps every job indexable instead of letting one long posting fail to sync,
// retry ten times through the outbox, and be dropped.
const INDEX_DESCRIPTION_CHARS = 5_000;

export const INDEX = {
  jobs: 'jobs',
  // Replicas for the search sort dropdown. Configure in Algolia with these
  // rankings (the search route falls back to `jobs` until they exist):
  //   jobs_recent       → publishedAt desc
  //   jobs_salary_desc  → salaryMax desc
  jobsRecent: 'jobs_recent',
  jobsSalaryDesc: 'jobs_salary_desc',
  companies: 'companies',
  skills: 'skills',
} as const;

export type JobSearchRecord = {
  objectID: string;
  slug: string;
  title: string;
  description: string;
  companyId: string;
  companyName: string;
  companyLogoUrl: string | null;
  industry: string;
  jobType: string;
  experienceLevel: string;
  workMode: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  /** What salaryMin/Max are per. Absent on records indexed before the field existed (= YEAR). */
  salaryPeriod?: string;
  /** Annualised bounds — the only numbers that are comparable across periods. */
  salaryAnnualMin?: number | null;
  salaryAnnualMax?: number | null;
  locationCountry?: string | null;
  publishedAt: number;
  skills: string[];
  _geoloc?: { lat: number; lng: number };
};

let _adminClient: ReturnType<typeof algoliasearch> | null = null;

/**
 * Query-path client. Uses a search-only key when one is configured: the public
 * search route must not hold a credential that can also write or delete the
 * index. Falls back to the admin key (with a one-time warning) so an existing
 * deployment keeps working until ALGOLIA_SEARCH_API_KEY is provisioned.
 */
let _searchClient: ReturnType<typeof algoliasearch> | null = null;
let _warnedAdminFallback = false;

export function searchClient() {
  if (_searchClient) return _searchClient;
  const appId = process.env.ALGOLIA_APP_ID;
  const searchKey = process.env.ALGOLIA_SEARCH_API_KEY;
  if (!appId) throw new Error('ALGOLIA_APP_ID must be set');
  if (!searchKey) {
    if (!_warnedAdminFallback) {
      _warnedAdminFallback = true;
      console.warn(
        '[algolia] ALGOLIA_SEARCH_API_KEY is not set — the public search route is using the admin key',
      );
    }
    _searchClient = adminClient();
    return _searchClient;
  }
  _searchClient = algoliasearch(appId, searchKey);
  return _searchClient;
}

export function adminClient() {
  if (_adminClient) return _adminClient;
  const appId = process.env.ALGOLIA_APP_ID;
  const adminKey = process.env.ALGOLIA_ADMIN_API_KEY;
  if (!appId || !adminKey) {
    throw new Error('ALGOLIA_APP_ID and ALGOLIA_ADMIN_API_KEY must be set');
  }
  _adminClient = algoliasearch(appId, adminKey);
  return _adminClient;
}

// Cheap connectivity check for /api/v1/health — search already degrades
// gracefully without Algolia, so this reports status rather than throwing.
export async function pingAlgolia(): Promise<'ok' | 'not_configured' | 'error'> {
  if (!process.env.ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_API_KEY) return 'not_configured';
  try {
    await adminClient().getSettings({ indexName: INDEX.jobs });
    return 'ok';
  } catch {
    return 'error';
  }
}

export function toJobRecord(
  job: JobPost & { company: { companyProfile: CompanyProfile | null } & Pick<User, 'id'> },
  skillLabels: string[],
): JobSearchRecord {
  return {
    objectID: job.id,
    slug: job.slug,
    title: job.title,
    description: job.description.slice(0, INDEX_DESCRIPTION_CHARS),
    companyId: job.companyId,
    companyName: job.company.companyProfile?.companyName ?? 'Company',
    companyLogoUrl: job.company.companyProfile?.logoUrl ?? null,
    industry: job.industry,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    workMode: job.workMode,
    location: job.location,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    salaryPeriod: job.salaryPeriod,
    salaryAnnualMin: toAnnual(job.salaryMin, job.salaryPeriod),
    salaryAnnualMax: toAnnual(job.salaryMax, job.salaryPeriod),
    locationCountry: job.locationCountry,
    publishedAt: (job.publishedAt ?? job.createdAt).getTime(),
    skills: skillLabels,
    _geoloc:
      job.locationLat !== null && job.locationLng !== null
        ? { lat: job.locationLat, lng: job.locationLng }
        : undefined,
  };
}

export async function upsertJob(record: JobSearchRecord): Promise<void> {
  await adminClient().saveObject({ indexName: INDEX.jobs, body: record });
}

export async function deleteJob(objectID: string): Promise<void> {
  await adminClient().deleteObject({ indexName: INDEX.jobs, objectID });
}
