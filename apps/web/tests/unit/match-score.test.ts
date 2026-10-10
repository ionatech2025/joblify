import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
  updateMany: vi.fn(),
  findUnique: vi.fn(),
  embedText: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    $queryRaw: m.queryRaw,
    $executeRaw: m.executeRaw,
    jobApplication: { updateMany: m.updateMany },
    jobPost: { findUnique: m.findUnique },
  },
}));
vi.mock('@/lib/ai/embeddings', () => ({
  embedText: m.embedText,
  toVectorLiteral: (v: number[]) => `[${v.join(',')}]`,
}));
vi.mock('@/lib/ai/gateway', () => ({ MODELS: { embedding: 'e' } }));
vi.mock('@/lib/observability/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { cosine, runMatchScore, embedJobPost } from '@/workflows/match-score.workflow';

describe('embedJobPost', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is idempotent — returns the cached embedding from the CURRENT model without an AI call', async () => {
    m.queryRaw.mockResolvedValueOnce([{ embedding: [1, 0, 0], embeddingModel: 'e' }]);
    const r = await embedJobPost('j');
    expect(r).toEqual([1, 0, 0]);
    expect(m.embedText).not.toHaveBeenCalled();
    expect(m.executeRaw).not.toHaveBeenCalled();
  });

  it('recomputes an embedding that came from a retired (or unknown) model', async () => {
    m.queryRaw.mockResolvedValueOnce([{ embedding: [1, 0, 0], embeddingModel: null }]);
    m.findUnique.mockResolvedValue({ title: 'T', description: 'D', requirements: null });
    m.embedText.mockResolvedValue({ embedding: [0.5, 0.5], model: 'e' });
    const r = await embedJobPost('j');
    expect(r).toEqual([0.5, 0.5]);
    expect(m.embedText).toHaveBeenCalledTimes(1);
  });

  it('computes and persists the embedding (and its model) when missing', async () => {
    m.queryRaw.mockResolvedValueOnce([{ embedding: null }]);
    m.findUnique.mockResolvedValue({ title: 'T', description: 'D', requirements: null });
    m.embedText.mockResolvedValue({ embedding: [0.5, 0.5], model: 'e' });
    const r = await embedJobPost('j');
    expect(r).toEqual([0.5, 0.5]);
    expect(m.embedText).toHaveBeenCalledTimes(1);
    expect(m.embedText.mock.calls[0]![0]).toContain('T');
    expect(m.embedText.mock.calls[0]![0]).toContain('D');
    expect(m.executeRaw).toHaveBeenCalledTimes(1); // raw pgvector UPDATE (embedding + model)
  });

  it('force-regenerates even when an embedding exists (JD text changed)', async () => {
    m.findUnique.mockResolvedValue({ title: 'T', description: 'D2', requirements: 'R' });
    m.embedText.mockResolvedValue({ embedding: [0.9, 0.1], model: 'e' });
    const r = await embedJobPost('j', { force: true });
    expect(r).toEqual([0.9, 0.1]);
    expect(m.queryRaw).not.toHaveBeenCalled(); // skips the cache read entirely
    expect(m.embedText).toHaveBeenCalledTimes(1);
    expect(m.executeRaw).toHaveBeenCalledTimes(1);
  });

  it('returns null for a job that no longer exists', async () => {
    m.queryRaw.mockResolvedValueOnce([]);
    m.findUnique.mockResolvedValue(null);
    const r = await embedJobPost('gone');
    expect(r).toBeNull();
    expect(m.embedText).not.toHaveBeenCalled();
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
    expect(m.embedText).not.toHaveBeenCalled();
    expect(m.updateMany).not.toHaveBeenCalled();
  });

  it('refuses to compare across a model boundary (resume vector from a retired model)', async () => {
    m.queryRaw.mockResolvedValueOnce([{ embedding: [1, 0, 0], embeddingModel: 'old-model' }]);
    const r = await runMatchScore({ jobPostId: 'j', jobSeekerId: 's' });
    expect(r).toBeNull();
    expect(m.updateMany).not.toHaveBeenCalled();
  });

  it('scores, and records which model produced the score and when', async () => {
    m.queryRaw
      .mockResolvedValueOnce([{ embedding: [1, 0, 0], embeddingModel: 'e' }]) // resume
      .mockResolvedValueOnce([{ embedding: [1, 0, 0], embeddingModel: 'e' }]); // job (already embedded)
    m.updateMany.mockResolvedValue({ count: 1 });
    const r = await runMatchScore({ jobPostId: 'j', jobSeekerId: 's' });
    expect(r).toBeCloseTo(1, 6);
    expect(m.embedText).not.toHaveBeenCalled(); // JD embedding present → no recompute
    expect(m.updateMany).toHaveBeenCalledTimes(1);
    const { data } = m.updateMany.mock.calls[0]![0];
    expect(data.matchModel).toBe('e');
    expect(data.matchScoredAt).toBeInstanceOf(Date);
  });
});
