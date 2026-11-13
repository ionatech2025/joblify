import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { prerender } from 'react-dom/static';

const m = vi.hoisted(() => ({
  currentUser: vi.fn(),
  requireRole: vi.fn(),
  jobFindUnique: vi.fn(),
  jobFindMany: vi.fn(),
  appFindUnique: vi.fn(),
  savedFindUnique: vi.fn(),
  resumeFindMany: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
}));

vi.mock('@/lib/auth', () => ({ currentUser: m.currentUser, requireRole: m.requireRole }));
vi.mock('@/lib/db', () => ({
  db: {
    jobPost: { findUnique: m.jobFindUnique, findMany: m.jobFindMany },
    jobApplication: { findUnique: m.appFindUnique },
    savedJob: { findUnique: m.savedFindUnique },
    resume: { findMany: m.resumeFindMany },
  },
}));
vi.mock('next/navigation', () => ({
  redirect: m.redirect,
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('next/server', () => ({ connection: vi.fn().mockResolvedValue(undefined) }));
vi.mock('next/cache', () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock('@/app/actions/saved-jobs', () => ({ toggleSavedJob: vi.fn() }));
vi.mock('@/app/actions/report-job', () => ({ reportJob: vi.fn() }));
vi.mock('@/app/actions/apply', () => ({ submitApplication: vi.fn() }));

import JobDetailPage from '@/app/(marketing)/jobs/[slug]/page';
import ApplyPage from '@/app/(marketing)/jobs/[slug]/apply/page';
import { ApplyPanel } from '@/app/(marketing)/jobs/[slug]/apply-panel';
import { SimilarJobs } from '@/app/(marketing)/jobs/[slug]/similar-jobs';
import { applicationsClosed } from '@/app/(marketing)/jobs/[slug]/deadline';

// Drops React's text-node separators so assertions can read sentences.
async function html(node: ReactNode): Promise<string> {
  const { prelude } = await prerender(node, { onError: () => {} });
  return (await new Response(prelude).text()).replaceAll('<!-- -->', '');
}

const DAY = 24 * 60 * 60 * 1000;
const PAST = new Date('2026-01-15T00:00:00Z');
const FUTURE = new Date(Date.now() + 30 * DAY);
const SEEKER = { id: 'seeker_1', userType: 'JOB_SEEKER' };

function job(applicationDeadline: Date | null) {
  return {
    id: 'job_1',
    slug: 'backend-engineer',
    title: 'Backend Engineer',
    description: 'Build things.',
    requirements: null,
    benefits: [],
    skills: [],
    industry: 'TECHNOLOGY',
    location: 'Kampala',
    locationCountry: null,
    jobType: 'FULL_TIME',
    workMode: 'ONSITE',
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    status: 'PUBLISHED',
    deletedAt: null,
    publishedAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    applicationDeadline,
    companyId: 'company_1',
    company: { id: 'company_1', deletedAt: null, companyProfile: { companyName: 'Acme' } },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  m.currentUser.mockResolvedValue(null);
  m.requireRole.mockResolvedValue(SEEKER);
  m.jobFindMany.mockResolvedValue([]);
  m.appFindUnique.mockResolvedValue(null);
  m.savedFindUnique.mockResolvedValue(null);
  m.resumeFindMany.mockResolvedValue([]);
});

describe('applicationsClosed', () => {
  it('is closed only once the deadline instant has passed', () => {
    const now = new Date('2026-03-01T12:00:00Z');
    expect(applicationsClosed(null, now)).toBe(false);
    expect(applicationsClosed(new Date('2026-03-01T11:59:59Z'), now)).toBe(true);
    expect(applicationsClosed(new Date('2026-03-01T12:00:01Z'), now)).toBe(false);
  });
});

describe('job detail page', () => {
  async function page() {
    return html(await JobDetailPage({ params: Promise.resolve({ slug: 'backend-engineer' }) }));
  }

  it('says applications closed, with the date, once the deadline has passed', async () => {
    m.jobFindUnique.mockResolvedValue(job(PAST));
    const out = await page();
    expect(out).toContain('Applications closed on January 15, 2026');
    expect(out).not.toContain('Apply by');
    expect(out).not.toContain('Sign in to apply');
  });

  it('still says "Apply by" while the job is open', async () => {
    m.jobFindUnique.mockResolvedValue(job(FUTURE));
    const out = await page();
    expect(out).toContain('Apply by');
    expect(out).toContain('Sign in to apply');
  });

  it('vouches for the employer only when an admin verified it, and shows when it was posted', async () => {
    const verified = job(FUTURE);
    verified.company.companyProfile = {
      companyName: 'Acme',
      verificationStatus: 'VERIFIED',
    } as typeof verified.company.companyProfile;
    m.jobFindUnique.mockResolvedValue(verified);
    const out = await page();
    expect(out).toContain('Verified employer');
    expect(out).toContain('Posted January 1, 2026');

    m.jobFindUnique.mockResolvedValue(job(FUTURE));
    expect(await page()).not.toContain('Verified employer');
  });
});

describe('ApplyPanel', () => {
  it('replaces "Start application" with the closed notice for a jobseeker', async () => {
    m.currentUser.mockResolvedValue(SEEKER);
    const out = await html(await ApplyPanel({ jobId: 'job_1', slug: 'x', deadline: PAST }));
    expect(out).toContain('No longer accepting applications');
    expect(out).toContain('Applications closed on January 15, 2026.');
    expect(out).not.toContain('Start application');
  });

  it('offers "Start application" while the job is open', async () => {
    m.currentUser.mockResolvedValue(SEEKER);
    const out = await html(await ApplyPanel({ jobId: 'job_1', slug: 'x', deadline: FUTURE }));
    expect(out).toContain('Start application');
  });

  it('keeps showing an existing application rather than the closed notice', async () => {
    m.currentUser.mockResolvedValue(SEEKER);
    m.appFindUnique.mockResolvedValue({ status: 'SUBMITTED', appliedAt: PAST });
    const out = await html(await ApplyPanel({ jobId: 'job_1', slug: 'x', deadline: PAST }));
    expect(out).toContain('You applied already');
    expect(out).not.toContain('No longer accepting applications');
  });
});

describe('apply page', () => {
  async function page() {
    return html(await ApplyPage({ params: Promise.resolve({ slug: 'backend-engineer' }) }));
  }

  it('blocks a closed job with the closing date instead of rendering the form', async () => {
    m.jobFindUnique.mockResolvedValue(job(PAST));
    const out = await page();
    expect(out).toContain('Applications for this role closed on January 15, 2026.');
    expect(out).not.toContain('Submit application');
    expect(out).not.toContain('name="coverLetter"');
  });

  it('sends someone who already applied to their applications, flagged so it can say why', async () => {
    m.jobFindUnique.mockResolvedValue(job(FUTURE));
    m.appFindUnique.mockResolvedValue({ id: 'app_1' });
    await page();
    expect(m.redirect).toHaveBeenCalledWith('/jobseeker/applications?already_applied=1');
  });
});

describe('SimilarJobs', () => {
  it('only asks for jobs that are still taking applications', async () => {
    const before = Date.now();
    await SimilarJobs({ jobId: 'job_1', industry: 'TECHNOLOGY', skillIds: ['s1'] });
    const where = m.jobFindMany.mock.lastCall?.[0].where;
    const open = where.AND[0].OR;
    expect(open[0]).toEqual({ applicationDeadline: null });
    expect(open[1].applicationDeadline.gt.getTime()).toBeGreaterThanOrEqual(before);
    expect(where.AND[1]).toEqual({
      OR: [{ skills: { some: { skillId: { in: ['s1'] } } } }, { industry: 'TECHNOLOGY' }],
    });
  });
});
