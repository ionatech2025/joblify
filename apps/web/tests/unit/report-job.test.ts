import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  requireUser: vi.fn(),
  limit: vi.fn(),
  jobFindFirst: vi.fn(),
  upsert: vi.fn(),
  audit: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireUser: m.requireUser }));
vi.mock('@/lib/ratelimit', () => ({ reportLimit: m.limit }));
vi.mock('@/lib/db', () => ({ db: { jobPost: { findFirst: m.jobFindFirst } } }));
vi.mock('@/lib/audit', () => ({
  withAudit: (ctx: unknown, meta: Record<string, unknown>, fn: (tx: unknown) => unknown) => {
    m.audit(ctx, meta);
    return fn({ jobReport: { upsert: m.upsert } });
  },
}));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn() } }));

import { reportJob } from '@/app/actions/report-job';

const JOB = '11111111-1111-4111-8111-111111111111';

beforeEach(() => {
  vi.clearAllMocks();
  m.requireUser.mockResolvedValue({ id: 'reporter-1' });
  m.limit.mockResolvedValue({ success: true });
  m.jobFindFirst.mockResolvedValue({ id: JOB, companyId: 'company-1' });
  m.upsert.mockResolvedValue({});
});

describe('reportJob', () => {
  it('files one report per (job, reporter) and audits the reason — not the free text', async () => {
    const res = await reportJob({ jobPostId: JOB, reason: 'SCAM', details: 'asks for a fee' });
    expect(res).toEqual({ ok: true, data: undefined });
    const arg = m.upsert.mock.calls[0]![0];
    expect(arg.where).toEqual({
      jobPostId_reporterId: { jobPostId: JOB, reporterId: 'reporter-1' },
    });
    expect(arg.create).toMatchObject({ reason: 'SCAM', details: 'asks for a fee' });
    expect(arg.update).toMatchObject({ status: 'OPEN', resolvedAt: null }); // re-opens a dismissed one
    const meta = m.audit.mock.calls[0]![1] as { action: string; after: () => unknown };
    expect(meta.action).toBe('JOB_REPORTED');
    expect(JSON.stringify(meta.after())).not.toContain('asks for a fee');
  });

  it('rejects an unknown reason and an over-long detail', async () => {
    expect((await reportJob({ jobPostId: JOB, reason: 'RUDE' as never })).ok).toBe(false);
    expect(
      (await reportJob({ jobPostId: JOB, reason: 'OTHER', details: 'x'.repeat(1001) })).ok,
    ).toBe(false);
    expect(m.upsert).not.toHaveBeenCalled();
  });

  it('does not let a company report its own posting', async () => {
    m.requireUser.mockResolvedValue({ id: 'company-1' });
    const res = await reportJob({ jobPostId: JOB, reason: 'SCAM' });
    expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/your own/) });
    expect(m.upsert).not.toHaveBeenCalled();
  });

  it('only a live, published posting can be reported', async () => {
    m.jobFindFirst.mockResolvedValue(null);
    expect((await reportJob({ jobPostId: JOB, reason: 'SCAM' })).ok).toBe(false);
    expect(m.jobFindFirst.mock.calls[0]![0].where).toMatchObject({
      status: 'PUBLISHED',
      deletedAt: null,
    });
  });

  it('is rate limited per reporter', async () => {
    m.limit.mockResolvedValue({ success: false });
    const res = await reportJob({ jobPostId: JOB, reason: 'SCAM' });
    expect(res.ok).toBe(false);
    expect(m.upsert).not.toHaveBeenCalled();
  });
});
