import { algoliasearch } from 'algoliasearch';
import type { JobPost, CompanyProfile, User } from '@prisma/client';

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
  publishedAt: number;
  skills: string[];
  _geoloc?: { lat: number; lng: number };
};

let _adminClient: ReturnType<typeof algoliasearch> | null = null;

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
    description: job.description,
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
