import { vi, describe, it, expect, beforeEach } from 'vitest';

// The public JD and company loaders are 'use cache' functions. A null they
// return is cached for hours, so it must carry a tag the publishing action
// clears; otherwise opening a draft's URL hides the job after it goes live.

const m = vi.hoisted(() => ({
  cacheTag: vi.fn(),
  jobFindUnique: vi.fn(),
  profileFindUnique: vi.fn(),
}));

vi.mock('next/cache', () => ({ cacheTag: m.cacheTag, cacheLife: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    jobPost: { findUnique: m.jobFindUnique },
    companyProfile: { findUnique: m.profileFindUnique },
  },
}));

import { getJobBySlug } from '@/app/(marketing)/jobs/[slug]/page';
import { getCompanyBySlug } from '@/app/(marketing)/companies/[slug]/page';

const job = (over: Record<string, unknown> = {}) => ({
  id: 'job1',
  companyId: 'co1',
  status: 'PUBLISHED',
  deletedAt: null,
  company: { deletedAt: null },
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe('getJobBySlug', () => {
  it('tags the null it caches for a draft with the job tag updateJob clears on publish', async () => {
    m.jobFindUnique.mockResolvedValue(job({ status: 'DRAFT' }));
    expect(await getJobBySlug('draft-slug')).toBeNull();
    expect(m.cacheTag.mock.calls.flat()).toContain('job:job1');
  });

  it('tags a slug no job has yet with the jobs tag postJob clears', async () => {
    m.jobFindUnique.mockResolvedValue(null);
    expect(await getJobBySlug('unknown')).toBeNull();
    expect(m.cacheTag.mock.calls.flat()).toEqual(['jobs']);
  });

  it('still tags a live job with its job and company', async () => {
    m.jobFindUnique.mockResolvedValue(job());
    expect(await getJobBySlug('live')).toMatchObject({ id: 'job1' });
    expect(m.cacheTag.mock.calls.flat()).toEqual(['job:job1', 'company:co1']);
  });
});

describe('getCompanyBySlug', () => {
  it('tags the null it caches for an unverified company with that company', async () => {
    m.profileFindUnique.mockResolvedValue({
      userId: 'co1',
      verificationStatus: 'PENDING',
      user: { deletedAt: null },
    });
    expect(await getCompanyBySlug('acme')).toBeNull();
    expect(m.cacheTag).toHaveBeenCalledWith('company:co1');
  });

  it('tags a slug no company has yet with the companies tag', async () => {
    m.profileFindUnique.mockResolvedValue(null);
    expect(await getCompanyBySlug('nobody')).toBeNull();
    expect(m.cacheTag).toHaveBeenCalledWith('companies');
  });
});
