import type { Prisma, WorkMode, JobType, ExperienceLevel } from '@prisma/client';
import { salaryOverlapWhere } from './salary';

const WORK_MODES = ['REMOTE', 'HYBRID', 'ONSITE'];
const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY'];
const EXP_LEVELS = ['ENTRY', 'MID', 'SENIOR', 'STAFF', 'EXECUTIVE'];

// Translate a saved /jobs query string into a Prisma JobPost filter for digest
// alerts. Mirrors the structured filters in /api/v1/jobs/search; the free-text
// `q` becomes a title/description contains (Algolia does the richer matching in
// the live UI — the digest only needs a reasonable structured match).
export function savedSearchWhere(query: string): Prisma.JobPostWhereInput {
  const p = new URLSearchParams(query);
  const where: Prisma.JobPostWhereInput = {};
  const and: Prisma.JobPostWhereInput[] = [];

  const workMode = p.get('workMode');
  if (workMode && WORK_MODES.includes(workMode)) where.workMode = workMode as WorkMode;

  const jobType = p.get('jobType');
  if (jobType && JOB_TYPES.includes(jobType)) where.jobType = jobType as JobType;

  const experienceLevel = p.get('experienceLevel');
  if (experienceLevel && EXP_LEVELS.includes(experienceLevel)) {
    where.experienceLevel = experienceLevel as ExperienceLevel;
  }

  // Bracket overlapping salary bands, as the search route does — on the
  // annualised range, so "per month" and "per year" postings compare fairly.
  const salaryMin = Number(p.get('salaryMin'));
  const salaryMax = Number(p.get('salaryMax'));
  const salaryWhere = salaryOverlapWhere(
    Number.isFinite(salaryMin) && salaryMin > 0 ? salaryMin : null,
    Number.isFinite(salaryMax) && salaryMax > 0 ? salaryMax : null,
  );
  if (salaryWhere) and.push(salaryWhere);

  const q = p.get('q')?.trim();
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  const location = p.get('location')?.trim();
  if (location) and.push({ location: { contains: location, mode: 'insensitive' } });

  if (and.length) where.AND = and;
  return where;
}

// A human-readable label derived from a query string, used when the jobseeker
// doesn't name the saved search themselves.
export function defaultSearchLabel(query: string): string {
  const p = new URLSearchParams(query);
  const parts: string[] = [];
  const q = p.get('q')?.trim();
  if (q) parts.push(`"${q}"`);
  const loc = p.get('location')?.trim();
  if (loc) parts.push(`in ${loc}`);
  const wm = p.get('workMode');
  if (wm && WORK_MODES.includes(wm)) parts.push(wm.toLowerCase());
  return parts.join(' ') || 'All jobs';
}
