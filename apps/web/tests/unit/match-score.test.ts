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

import { cosine, runMatchScore, embedJobPost } from '@/workflows/match-score.workflow';

describe('embedJobPost', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is idempotent — returns the cached embedding without an AI call', async () => {
    m.queryRaw.mockResolvedValueOnce([{ embedding: [1, 0, 0] }]);
    const r = await embedJobPost('j');
    expect(r).toEqual([1, 0, 0]);
    expect(m.embed).not.toHaveBeenCalled();
    expect(m.executeRaw).not.toHaveBeenCalled();
  });

  it('computes and persists the embedding when missing', async () => {
    m.queryRaw.mockResolvedValueOnce([{ embedding: null }]);
    m.findUnique.mockResolvedValue({ title: 'T', description: 'D', requirements: null });
    m.embed.mockResolvedValue({ embedding: [0.5, 0.5] });
    const r = await embedJobPost('j');
    expect(r).toEqual([0.5, 0.5]);
    expect(m.embed).toHaveBeenCalledTimes(1);
    expect(m.embed.mock.calls[0]![0].value).toContain('T');
    expect(m.embed.mock.calls[0]![0].value).toContain('D');
    expect(m.executeRaw).toHaveBeenCalledTimes(1); // raw pgvector UPDATE
  });

  it('force-regenerates even when an embedding exists (JD text changed)', async () => {
    m.findUnique.mockResolvedValue({ title: 'T', description: 'D2', requirements: 'R' });
    m.embed.mockResolvedValue({ embedding: [0.9, 0.1] });
    const r = await embedJobPost('j', { force: true });
    expect(r).toEqual([0.9, 0.1]);
    expect(m.queryRaw).not.toHaveBeenCalled(); // skips the cache read entirely
    expect(m.embed).toHaveBeenCalledTimes(1);
    expect(m.executeRaw).toHaveBeenCalledTimes(1);
  });

  it('returns null for a job that no longer exists', async () => {
    m.queryRaw.mockResolvedValueOnce([]);
    m.findUnique.mockResolvedValue(null);
    const r = await embedJobPost('gone');
    expect(r).toBeNull();
    expect(m.embed).not.toHaveBeenCalled();
  });
});

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
