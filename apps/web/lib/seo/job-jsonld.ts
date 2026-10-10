import type { JobPost, CompanyProfile, User } from '@prisma/client';
import { safeJsonLd } from './json-ld';

// Google JobPosting structured data. Renders into the JD page <script> tag so
// jobs are eligible for Google Jobs rich results — non-negotiable for SEO.
// https://developers.google.com/search/docs/appearance/structured-data/job-posting
//
// What Google requires/recommends, and where each value comes from:
//   required     title, description, datePosted, hiringOrganization,
//                jobLocation (with address.addressCountry) — or, for a fully
//                remote role, applicantLocationRequirements
//   recommended  baseSalary (+ unitText), employmentType, validThrough,
//                directApply, identifier, jobLocationType
// Pay is only published when the employer gave a range AND said what it is per
// (JobPost.salaryPeriod); a wrong `unitText` is treated as misleading markup.

export function jobPostingJsonLd(opts: {
  job: JobPost;
  company: Pick<User, 'id'> & { companyProfile: CompanyProfile | null };
  siteUrl: string;
}): string {
  const { job, company, siteUrl } = opts;
  const profile = company.companyProfile;
  const employmentType = mapEmploymentType(job.jobType);
  const country = job.locationCountry?.trim().toUpperCase() || null;
  const remote = job.workMode === 'REMOTE';

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: (job.publishedAt ?? job.createdAt).toISOString(),
    validThrough: job.applicationDeadline?.toISOString(),
    employmentType,
    hiringOrganization: profile
      ? {
          '@type': 'Organization',
          name: profile.companyName,
          sameAs: profile.website ?? undefined,
          logo: profile.logoUrl ?? undefined,
        }
      : undefined,
    // A physical location is required unless the job is 100% remote with
    // applicant location requirements.
    jobLocation:
      job.location || country
        ? {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressLocality: job.location || undefined,
              // Required by Google; only emitted when the employer supplied it.
              addressCountry: country ?? undefined,
            },
          }
        : undefined,
    jobLocationType: remote ? 'TELECOMMUTE' : undefined,
    // Required alongside TELECOMMUTE: where applicants may be located.
    applicantLocationRequirements:
      remote && country ? { '@type': 'Country', name: country } : undefined,
    baseSalary: baseSalary(job),
    // Applying happens on this page (the apply flow is on-site), not by
    // bouncing to an external ATS.
    directApply: true,
    url: `${siteUrl}/jobs/${job.slug}`,
    identifier: { '@type': 'PropertyValue', name: 'Joblify', value: job.id },
  };

  // safeJsonLd, not JSON.stringify: the result is dropped into an inline
  // <script>, and employer-authored text must not be able to close it.
  return safeJsonLd(data);
}

function baseSalary(job: JobPost): Record<string, unknown> | undefined {
  const { salaryMin, salaryMax } = job;
  if (!salaryMin && !salaryMax) return undefined;

  const value: Record<string, unknown> = {
    '@type': 'QuantitativeValue',
    unitText: job.salaryPeriod,
  };
  if (salaryMin && salaryMax) {
    value.minValue = salaryMin;
    value.maxValue = salaryMax;
  } else {
    // One-sided range: a single stated figure is "value", not a min/max pair.
    value.value = salaryMin ?? salaryMax;
  }

  return { '@type': 'MonetaryAmount', currency: job.salaryCurrency, value };
}

function mapEmploymentType(jobType: JobPost['jobType']): string {
  switch (jobType) {
    case 'FULL_TIME':
      return 'FULL_TIME';
    case 'PART_TIME':
      return 'PART_TIME';
    case 'CONTRACT':
      return 'CONTRACTOR';
    case 'INTERNSHIP':
      return 'INTERN';
    case 'TEMPORARY':
      return 'TEMPORARY';
    default:
      return 'OTHER';
  }
}
