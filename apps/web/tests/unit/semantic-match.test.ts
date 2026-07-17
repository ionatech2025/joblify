import { vi, describe, it, expect, beforeEach } from 'vitest';

// Semantic job discovery (Phase 5): reuses the same resume/job-post pgvector
// embeddings that already power the per-application match score, but as a
// nearest-neighbor query for "jobs like what you're good at" instead of a
// 1:1 score computed after applying.

const m = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: { $queryRaw: m.queryRaw, jobPost: { findMany: m.findMany } },
}));

import { getRecommendedJobs } from '@/lib/search/semantic-match';

beforeEach(() => vi.clearAllMocks());

describe('getRecommendedJobs', () => {
  it('returns an empty list without querying jobPost when no rows rank', async () => {
    m.queryRaw.mockResolvedValue([]);
    const result = await getRecommendedJobs('seeker1');
    expect(result).toEqual([]);
    expect(m.findMany).not.toHaveBeenCalled();
  });

  it('fetches display data for ranked ids and preserves similarity order', async () => {
    m.queryRaw.mockResolvedValue([
      { id: 'job-b', similarity: 0.91 },
      { id: 'job-a', similarity: 0.87 },
    ]);
    // findMany intentionally returns a different order than the ranked rows —
    // the function must re-sort by the ranked order, not trust findMany's.
    m.findMany.mockResolvedValue([
      {
        id: 'job-a',
        slug: 'job-a-slug',
        title: 'Backend Engineer',
        location: 'Remote',
        workMode: 'REMOTE',
        company: { companyProfile: { companyName: 'Acme' } },
      },
      {
        id: 'job-b',
        slug: 'job-b-slug',
        title: 'Platform Engineer',
        location: null,
        workMode: 'HYBRID',
        company: { companyProfile: { companyName: 'Globex' } },
      },
    ]);

    const result = await getRecommendedJobs('seeker1', 5);

    expect(m.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['job-b', 'job-a'] } },
      select: expect.any(Object),
    });
    expect(result).toEqual([
      {
        id: 'job-b',
        slug: 'job-b-slug',
        title: 'Platform Engineer',
        companyName: 'Globex',
        location: null,
        workMode: 'HYBRID',
        similarity: 0.91,
      },
      {
        id: 'job-a',
        slug: 'job-a-slug',
        title: 'Backend Engineer',
        companyName: 'Acme',
        location: 'Remote',
        workMode: 'REMOTE',
        similarity: 0.87,
      },
    ]);
  });

  it('falls back to "Company" when the company profile has no name yet', async () => {
    m.queryRaw.mockResolvedValue([{ id: 'job-a', similarity: 0.8 }]);
    m.findMany.mockResolvedValue([
      {
        id: 'job-a',
        slug: 'job-a-slug',
        title: 'Engineer',
        location: null,
        workMode: 'ONSITE',
        company: { companyProfile: null },
      },
    ]);
    const result = await getRecommendedJobs('seeker1');
    expect(result[0]!.companyName).toBe('Company');
  });

  it('silently drops a ranked id that no longer resolves to a live job', async () => {
    m.queryRaw.mockResolvedValue([{ id: 'job-gone', similarity: 0.75 }]);
    m.findMany.mockResolvedValue([]);
    const result = await getRecommendedJobs('seeker1');
    expect(result).toEqual([]);
  });
});
