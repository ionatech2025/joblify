import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  findMany: vi.fn(),
  del: vi.fn(),
  update: vi.fn(),
  findUnique: vi.fn(),
  upsertJob: vi.fn(),
  deleteJob: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    indexOutbox: { findMany: m.findMany, delete: m.del, update: m.update },
    jobPost: { findUnique: m.findUnique },
  },
}));
vi.mock('@/lib/search/algolia', () => ({
  upsertJob: m.upsertJob,
  deleteJob: m.deleteJob,
  toJobRecord: (job: { id: string }) => ({ objectID: job.id }),
}));
vi.mock('@/lib/observability/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { drainIndexOutbox } from '@/lib/search/index-job';

const liveJob = { id: 'j1', deletedAt: null, status: 'PUBLISHED', skills: [], company: {} };

describe('drainIndexOutbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.findUnique.mockResolvedValue(liveJob);
    m.upsertJob.mockResolvedValue(undefined);
    m.deleteJob.mockResolvedValue(undefined);
  });

  it('re-syncs and deletes the row on success', async () => {
    m.findMany.mockResolvedValue([{ id: 'o1', entityId: 'j1', attempts: 0 }]);
    const r = await drainIndexOutbox();
    expect(r).toEqual({ drained: 1, failed: 0, dropped: 0 });
    expect(m.upsertJob).toHaveBeenCalledTimes(1);
    expect(m.del).toHaveBeenCalledWith({ where: { id: 'o1' } });
  });

  it('bumps attempts on failure below the cap', async () => {
    m.findMany.mockResolvedValue([{ id: 'o1', entityId: 'j1', attempts: 2 }]);
    m.upsertJob.mockRejectedValue(new Error('algolia down'));
    const r = await drainIndexOutbox();
    expect(r).toEqual({ drained: 0, failed: 1, dropped: 0 });
    expect(m.update).toHaveBeenCalledTimes(1);
    expect(m.del).not.toHaveBeenCalled();
  });

  it('drops the row after the max attempts', async () => {
    m.findMany.mockResolvedValue([{ id: 'o1', entityId: 'j1', attempts: 9 }]); // 9 + 1 >= 10
    m.upsertJob.mockRejectedValue(new Error('still down'));
    const r = await drainIndexOutbox();
    expect(r).toEqual({ drained: 0, failed: 0, dropped: 1 });
    expect(m.del).toHaveBeenCalledWith({ where: { id: 'o1' } });
  });

  it('deletes from Algolia for a job that is no longer live', async () => {
    m.findMany.mockResolvedValue([{ id: 'o1', entityId: 'j1', attempts: 0 }]);
    m.findUnique.mockResolvedValue(null); // hard-deleted
    const r = await drainIndexOutbox();
    expect(m.deleteJob).toHaveBeenCalledWith('j1');
    expect(r.drained).toBe(1);
  });
});
