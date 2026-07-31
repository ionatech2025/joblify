import { vi, describe, it, expect, beforeEach } from 'vitest';

// The algolia-reconcile cron's AI-derivation sweep (#37): bounded recovery of
// resumes stranded with parsedJson/embedding NULL and published jobs with a
// NULL embedding, with a parseAttempts poison cap.

const m = vi.hoisted(() => ({
  requireCronAuth: vi.fn(),
  jobFindMany: vi.fn(),
  resumeUpdate: vi.fn(),
  queryRaw: vi.fn(),
  reindexJob: vi.fn(),
  drainIndexOutbox: vi.fn(),
  runResumeParse: vi.fn(),
  embedJobPost: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('@/lib/cron-auth', () => ({ requireCronAuth: m.requireCronAuth }));
vi.mock('@/lib/db', () => ({
  db: {
    jobPost: { findMany: m.jobFindMany },
    resume: { update: m.resumeUpdate },
    $queryRaw: m.queryRaw,
  },
}));
vi.mock('@/lib/search/index-job', () => ({
  reindexJob: m.reindexJob,
  drainIndexOutbox: m.drainIndexOutbox,
}));
vi.mock('@/workflows/resume-parse.workflow', () => ({ runResumeParse: m.runResumeParse }));
vi.mock('@/workflows/match-score.workflow', () => ({ embedJobPost: m.embedJobPost }));
vi.mock('@sentry/nextjs', () => ({
  captureException: m.captureException,
  captureMessage: m.captureMessage,
}));
vi.mock('@/lib/observability/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { GET } from '@/app/api/v1/cron/algolia-reconcile/route';

const req = () => new Request('http://localhost/api/v1/cron/algolia-reconcile');

// $queryRaw is a tagged template: calls[i][0] is the strings array, the rest
// are the bound parameters.
function rawCall(i: number): { sql: string; params: unknown[] } {
  const call = m.queryRaw.mock.calls[i]!;
  return { sql: (call[0] as string[]).join('?'), params: call.slice(1) };
}

describe('algolia-reconcile sweep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.requireCronAuth.mockReturnValue(null);
    m.jobFindMany.mockResolvedValue([]);
    m.drainIndexOutbox.mockResolvedValue({ drained: 0, failed: 0, dropped: 0 });
    m.queryRaw.mockResolvedValue([]); // both sweep selections default to empty
    m.resumeUpdate.mockResolvedValue({});
    m.runResumeParse.mockResolvedValue(undefined);
    m.embedJobPost.mockResolvedValue([0.1]);
  });

  it('short-circuits with the denial response from requireCronAuth', async () => {
    const deny = new Response('nope', { status: 401 });
    m.requireCronAuth.mockReturnValue(deny);
    const res = await GET(req());
    expect(res).toBe(deny);
    expect(m.queryRaw).not.toHaveBeenCalled();
    expect(m.jobFindMany).not.toHaveBeenCalled();
  });

  it('selects stranded resumes: NULL fields, >10min old, under the attempt cap, oldest first, limit 20', async () => {
    await GET(req());
    const { sql, params } = rawCall(0);
    expect(sql).toContain('FROM resumes');
    expect(sql).toContain('"deletedAt" IS NULL');
    expect(sql).toContain('("parsedJson" IS NULL OR embedding IS NULL)');
    expect(sql).toContain('"createdAt" <');
    expect(sql).toContain('"parseAttempts" <');
    expect(sql).toContain('ORDER BY "createdAt" ASC');
    expect(sql).toContain('LIMIT');
    // Bound params: age cutoff ~10min ago, attempt cap 5, limit 20.
    const cutoff = params.find((p): p is Date => p instanceof Date)!;
    const ageMin = (Date.now() - cutoff.getTime()) / 60_000;
    expect(ageMin).toBeGreaterThan(9.9);
    expect(ageMin).toBeLessThan(10.1);
    expect(params).toContain(5);
    expect(params).toContain(20);
  });

  it('selects published, non-deleted jobs with a NULL embedding, oldest first, limit 20', async () => {
    await GET(req());
    const { sql, params } = rawCall(1);
    expect(sql).toContain('FROM job_posts');
    expect(sql).toContain("status = 'PUBLISHED'");
    expect(sql).toContain('"deletedAt" IS NULL');
    expect(sql).toContain('embedding IS NULL');
    expect(sql).toContain('ORDER BY "publishedAt" ASC');
    expect(params).toContain(20);
  });

  it('re-runs the parse path, counting the attempt up front', async () => {
    m.queryRaw
      .mockResolvedValueOnce([{ id: 'r1', parseAttempts: 0 }])
      .mockResolvedValueOnce([{ id: 'j1' }]);
    const res = await GET(req());
    expect(m.resumeUpdate).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { parseAttempts: { increment: 1 } },
    });
    expect(m.runResumeParse).toHaveBeenCalledWith({ resumeId: 'r1' });
    expect(m.embedJobPost).toHaveBeenCalledWith('j1');
    const body = await res.json();
    expect(body.sweep).toMatchObject({ resumesRepaired: 1, jobsEmbedded: 1, stoppedEarly: false });
  });

  it('reports a failed retry to Sentry with the resume id, without the cap message', async () => {
    m.queryRaw.mockResolvedValueOnce([{ id: 'r1', parseAttempts: 1 }]).mockResolvedValueOnce([]);
    m.runResumeParse.mockRejectedValue(new Error('gateway down'));
    const res = await GET(req());
    expect(m.captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { resumeId: 'r1' },
    });
    expect(m.captureMessage).not.toHaveBeenCalled(); // 2 of 5 attempts — not poisoned yet
    expect((await res.json()).sweep.resumesFailed).toBe(1);
  });

  it('surfaces a poison resume once when the attempt cap is reached', async () => {
    m.queryRaw.mockResolvedValueOnce([{ id: 'r1', parseAttempts: 4 }]).mockResolvedValueOnce([]);
    m.runResumeParse.mockRejectedValue(new Error('always fails'));
    await GET(req());
    // attempt 5 of 5 → the "gave up" signal (the next sweep excludes the row).
    expect(m.captureMessage).toHaveBeenCalledTimes(1);
    expect(m.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('permanently failed'),
      expect.objectContaining({ level: 'error', tags: { resumeId: 'r1' } }),
    );
    // parseFailedAt makes the terminal state visible to the UI — otherwise
    // "still retrying" and "never will" look identical (parsedJson null).
    expect(m.resumeUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 'r1' },
      data: { parseFailedAt: expect.any(Date), parseError: 'always fails' },
    });
  });

  it('reports failed job embeds to Sentry with the job id and keeps sweeping', async () => {
    m.queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'j1' }, { id: 'j2' }]);
    m.embedJobPost.mockRejectedValueOnce(new Error('embed down')).mockResolvedValueOnce([0.1]);
    const res = await GET(req());
    expect(m.captureException).toHaveBeenCalledWith(expect.any(Error), { tags: { jobId: 'j1' } });
    const body = await res.json();
    expect(body.sweep).toMatchObject({ jobsTried: 2, jobsEmbedded: 1, jobsFailed: 1 });
  });
});
