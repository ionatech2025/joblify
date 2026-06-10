import type { JobPost, CompanyProfile, User } from '@prisma/client';

// Google JobPosting structured data. Renders into the JD page <script> tag so
// jobs are eligible for Google Jobs rich results — non-negotiable for SEO.
// https://developers.google.com/search/docs/appearance/structured-data/job-posting

export function jobPostingJsonLd(opts: {
  job: JobPost;
  company: Pick<User, 'id'> & { companyProfile: CompanyProfile | null };
  siteUrl: string;
}): string {
  const { job, company, siteUrl } = opts;
  const profile = company.companyProfile;
  const employmentType = mapEmploymentType(job.jobType);

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
    jobLocation: job.location
      ? {
          '@type': 'Place',
          address: { '@type': 'PostalAddress', addressLocality: job.location },
        }
      : undefined,
    jobLocationType: job.workMode === 'REMOTE' ? 'TELECOMMUTE' : undefined,
    baseSalary:
      job.salaryMin && job.salaryMax
        ? {
            '@type': 'MonetaryAmount',
            currency: job.salaryCurrency,
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salaryMin,
              maxValue: job.salaryMax,
              unitText: 'YEAR',
            },
          }
        : undefined,
    url: `${siteUrl}/jobs/${job.slug}`,
    identifier: { '@type': 'PropertyValue', name: 'Joblify', value: job.id },
  };

  return JSON.stringify(data);
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
