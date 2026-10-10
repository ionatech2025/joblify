import { describe, it, expect } from 'vitest';
import type { JobPost, CompanyProfile } from '@prisma/client';
import { safeJsonLd } from '@/lib/seo/json-ld';
import { jobPostingJsonLd } from '@/lib/seo/job-jsonld';

describe('safeJsonLd', () => {
  it('cannot be closed early by employer-authored text', () => {
    const hostile = '</script><script>alert(document.cookie)</script><!-- & -->';
    const out = safeJsonLd({ description: hostile });
    expect(out).not.toContain('</script');
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    // …and it is still the same JSON: parsers (and Google) recover the original.
    expect(JSON.parse(out).description).toBe(hostile);
  });

  it('escapes the JS line separators too', () => {
    const ls = String.fromCharCode(0x2028);
    const ps = String.fromCharCode(0x2029);
    const out = safeJsonLd({ t: `a${ls}b${ps}c` });
    expect(out).not.toContain(ls);
    expect(out).not.toContain(ps);
    expect(JSON.parse(out).t).toBe(`a${ls}b${ps}c`);
  });
});

const BASE = {
  id: 'job-1',
  slug: 'rust-engineer-ab12cd',
  title: 'Rust Engineer',
  description: 'Build things.',
  jobType: 'FULL_TIME',
  workMode: 'ONSITE',
  location: 'Kampala',
  locationCountry: 'UG',
  salaryMin: 3_000_000,
  salaryMax: 4_500_000,
  salaryCurrency: 'UGX',
  salaryPeriod: 'MONTH',
  applicationDeadline: null,
  publishedAt: new Date('2026-10-01T00:00:00Z'),
  createdAt: new Date('2026-09-30T00:00:00Z'),
} as unknown as JobPost;

const COMPANY = {
  id: 'c1',
  companyProfile: {
    companyName: 'Acme',
    website: 'https://acme.test',
    logoUrl: null,
  } as unknown as CompanyProfile,
};

// The parsed document is deliberately untyped — the tests probe its shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ld(job: Partial<JobPost> = {}): Record<string, any> {
  return JSON.parse(
    jobPostingJsonLd({
      job: { ...BASE, ...job } as JobPost,
      company: COMPANY,
      siteUrl: 'https://joblify.test',
    }),
  );
}

describe('jobPostingJsonLd', () => {
  it('states pay in the unit the employer chose — a monthly salary is not "per YEAR"', () => {
    const pay = ld().baseSalary;
    expect(pay.currency).toBe('UGX');
    expect(pay.value).toMatchObject({
      minValue: 3_000_000,
      maxValue: 4_500_000,
      unitText: 'MONTH',
    });
  });

  it('emits the REQUIRED addressCountry when the employer supplied one', () => {
    expect(ld().jobLocation.address).toMatchObject({
      addressLocality: 'Kampala',
      addressCountry: 'UG',
    });
  });

  it('a remote role carries applicantLocationRequirements alongside TELECOMMUTE', () => {
    const remote = ld({ workMode: 'REMOTE' });
    expect(remote.jobLocationType).toBe('TELECOMMUTE');
    expect(remote.applicantLocationRequirements).toEqual({ '@type': 'Country', name: 'UG' });
  });

  it('a one-sided range is a single value, not a fake min/max', () => {
    const pay = ld({ salaryMax: null }).baseSalary;
    expect(pay.value.value).toBe(3_000_000);
    expect(pay.value).not.toHaveProperty('minValue');
  });

  it('omits baseSalary entirely when no figure was given', () => {
    expect(ld({ salaryMin: null, salaryMax: null })).not.toHaveProperty('baseSalary');
  });

  it('marks direct application and survives a hostile title', () => {
    const doc = ld({ title: '</script><img src=x onerror=alert(1)>' });
    expect(doc.directApply).toBe(true);
    expect(
      jobPostingJsonLd({
        job: { ...BASE, title: '</script>' } as JobPost,
        company: COMPANY,
        siteUrl: 'https://joblify.test',
      }),
    ).not.toContain('</script');
  });
});
