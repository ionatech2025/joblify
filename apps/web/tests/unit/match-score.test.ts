import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
  updateMany: vi.fn(),
  findUnique: vi.fn(),
  embed: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    $queryRaw: m.queryRaw,
    $executeRaw: m.executeRaw,
    jobApplication: { updateMany: m.updateMany },
    jobPost: { findUnique: m.findUnique },
  },
}));
vi.mock('ai', () => ({ embed: m.embed }));
vi.mock('@/lib/ai/gateway', () => ({ gateway: { textEmbeddingModel: () => ({}) }, MODELS: { embeddingLarge: 'e' } }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { cosine, runMatchScore } from '@/workflows/match-score.workflow';

describe('cosine', () => {
  it('is 1 for identical vectors', () => expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6));
  it('is 0 for orthogonal vectors', () => expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 6));
  it('is 0 when a vector is all zeros', () => expect(cosine([0, 0], [1, 1])).toBe(0));
  it('throws on a length mismatch', () => expect(() => cosine([1], [1, 2])).toThrow(/length/));
});

describe('runMatchScore', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null and never calls the model when there is no resume embedding', async () => {
    m.queryRaw.mockResolvedValueOnce([]); // resume embedding lookup → none
    const r = await runMatchScore({ jobPostId: 'j', jobSeekerId: 's' });
    expect(r).toBeNull();
    expect(m.embed).not.toHaveBeenCalled();
    expect(m.updateMany).not.toHaveBeenCalled();
  });

  it('scores and persists when both embeddings already exist', async () => {
    m.queryRaw
      .mockResolvedValueOnce([{ embedding: [1, 0, 0] }]) // resume
      .mockResolvedValueOnce([{ embedding: [1, 0, 0] }]); // job (already embedded)
    m.updateMany.mockResolvedValue({ count: 1 });
    const r = await runMatchScore({ jobPostId: 'j', jobSeekerId: 's' });
    expect(r).toBeCloseTo(1, 6);
    expect(m.embed).not.toHaveBeenCalled(); // JD embedding present → no recompute
    expect(m.updateMany).toHaveBeenCalledTimes(1);
  });
});
