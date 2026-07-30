import { vi, describe, it, expect, beforeEach } from 'vitest';

// Digest cron rework (#44): per-user lastDigestAt watermark, one generic job
// list per run, watermark-cursor pages, concurrency-chunked sends with
// per-chunk stamping, and a wall-clock deadline.

const m = vi.hoisted(() => ({
  userFind: vi.fn(),
  userCount: vi.fn(),
  userUpdate: vi.fn(),
  jobFind: vi.fn(),
  send: vi.fn(),
  savedFind: vi.fn(),
  savedUpdate: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: { findMany: m.userFind, count: m.userCount, updateMany: m.userUpdate },
    jobPost: { findMany: m.jobFind },
    savedSearch: { findMany: m.savedFind, updateMany: m.savedUpdate },
  },
}));
vi.mock('@/lib/email/resend', () => ({
  resend: () => ({ emails: { send: m.send } }),
  EMAIL_FROM: 'no-reply@joblify.test',
}));
vi.mock('@sentry/nextjs', () => ({ captureException: m.captureException }));
vi.mock('@/lib/observability/logger', () => ({ logger: { warn: vi.fn(), info: vi.fn() } }));

import { runDigest } from '@/workflows/digest-email.workflow';

const HOUR = 3600 * 1000;
const job = {
  id: 'j1',
  slug: 'eng',
  title: 'Engineer',
  company: { companyProfile: { companyName: 'Acme' } },
};

function seeker(id: string) {
  return { id, email: `${id}@x.com`, firstName: id.toUpperCase() };
}

describe('runDigest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.send.mockResolvedValue({});
    m.userFind.mockResolvedValue([]); // default: no more pages → loop ends
    m.userCount.mockResolvedValue(0);
    m.userUpdate.mockResolvedValue({ count: 0 });
    m.jobFind.mockResolvedValue([]);
    m.savedFind.mockResolvedValue([]); // default: no saved searches → generic list
    m.savedUpdate.mockResolvedValue({ count: 0 });
  });

  it('selects only consented, non-suppressed, non-deleted jobseekers with a null-or-stale watermark', async () => {
    await runDigest();
    const args = m.userFind.mock.calls[0]![0];
    expect(args.where.userType).toBe('JOB_SEEKER');
    expect(args.where.deletedAt).toBeNull();
    expect(args.where.emailSuppressedAt).toBeNull();
    expect(args.where.consentJson).toBeDefined(); // { not: Prisma.DbNull }
    // Watermark window: never digested OR digested before the padded cutoff
    // (24h - 2h slack, so a run stamped minutes after yesterday's schedule
    // still qualifies today).
    expect(args.where.OR).toEqual([
      { lastDigestAt: null },
      { lastDigestAt: { lt: expect.any(Date) } },
    ]);
    const cutoffAge = (Date.now() - args.where.OR[1].lastDigestAt.lt.getTime()) / HOUR;
    expect(cutoffAge).toBeGreaterThan(21.9);
    expect(cutoffAge).toBeLessThan(22.1);
    // Oldest watermark first, never-digested (null) leading; paged, not capped.
    expect(args.orderBy).toEqual([
      { lastDigestAt: { sort: 'asc', nulls: 'first' } },
      { id: 'asc' },
    ]);
    expect(args.take).toBe(200);
  });

  it('computes the generic 24h job list once per run, not once per user', async () => {
    m.userFind.mockResolvedValueOnce([seeker('u1'), seeker('u2'), seeker('u3')]);
    m.jobFind.mockResolvedValueOnce([job]); // the single generic-list query
    const r = await runDigest();
    expect(m.jobFind).toHaveBeenCalledTimes(1);
    const where = m.jobFind.mock.calls[0]![0].where;
    expect(where.status).toBe('PUBLISHED');
    expect(where.deletedAt).toBeNull();
    expect(where.publishedAt.gte).toBeInstanceOf(Date);
    expect(m.send).toHaveBeenCalledTimes(3);
    expect(r).toEqual({ sent: 3, skipped: 0, failed: 0, stoppedEarly: false });
  });

  it('stamps lastDigestAt per chunk for processed users and leaves failed sends unstamped', async () => {
    m.userFind.mockResolvedValueOnce([seeker('u1'), seeker('u2')]);
    m.jobFind.mockResolvedValueOnce([job]);
    m.send.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('resend down'));
    const r = await runDigest();
    expect(r).toEqual({ sent: 1, skipped: 0, failed: 1, stoppedEarly: false });
    // Only the successful send advanced its watermark…
    expect(m.userUpdate).toHaveBeenCalledTimes(1);
    expect(m.userUpdate.mock.calls[0]![0]).toEqual({
      where: { id: { in: ['u1'] } },
      data: { lastDigestAt: expect.any(Date) },
    });
    // …the failure went to Sentry with the user id…
    expect(m.captureException).toHaveBeenCalledWith(expect.any(Error), { tags: { userId: 'u2' } });
    // …and the next page query excludes the failed id so the loop can't spin on it.
    expect(m.userFind.mock.calls[1]![0].where.id).toEqual({ notIn: ['u2'] });
  });

  it('advances the watermark for users with nothing new (skipped, no email, no re-selection)', async () => {
    m.userFind.mockResolvedValueOnce([seeker('u1')]);
    m.jobFind.mockResolvedValue([]); // generic list empty
    const r = await runDigest();
    expect(r).toEqual({ sent: 0, skipped: 1, failed: 0, stoppedEarly: false });
    expect(m.send).not.toHaveBeenCalled();
    expect(m.userUpdate).toHaveBeenCalledWith({
      where: { id: { in: ['u1'] } },
      data: { lastDigestAt: expect.any(Date) },
    });
  });

  it('sends in chunks of 25 with per-chunk stamping', async () => {
    const users = Array.from({ length: 30 }, (_, i) => seeker(`u${i}`));
    m.userFind.mockResolvedValueOnce(users);
    m.jobFind.mockResolvedValueOnce([job]);
    const r = await runDigest();
    expect(r.sent).toBe(30);
    // 30 users → a 25-chunk and a 5-chunk, each stamped right after settling.
    expect(m.userUpdate).toHaveBeenCalledTimes(2);
    expect(m.userUpdate.mock.calls[0]![0].where.id.in).toHaveLength(25);
    expect(m.userUpdate.mock.calls[1]![0].where.id.in).toHaveLength(5);
  });

  it('personalizes for saved-search users and stamps lastNotifiedAt only after processing', async () => {
    m.userFind.mockResolvedValueOnce([seeker('u1')]);
    m.savedFind.mockResolvedValueOnce([
      { userId: 'u1', query: 'workMode=REMOTE', lastNotifiedAt: null },
    ]);
    m.jobFind
      .mockResolvedValueOnce([]) // generic list (computed once, unused here)
      .mockResolvedValueOnce([job]); // the saved-search diff
    const r = await runDigest();
    expect(r).toEqual({ sent: 1, skipped: 0, failed: 0, stoppedEarly: false });
    expect(m.send.mock.calls[0]![0].to).toBe('u1@x.com');
    // The saved-search query carried the structured filter + its own window.
    const searchWhere = m.jobFind.mock.calls[1]![0].where;
    expect(searchWhere.AND[0].workMode).toBe('REMOTE');
    expect(searchWhere.AND[1].publishedAt.gte).toBeInstanceOf(Date);
    // Watermark + per-search watermark stamped together, post-send.
    expect(m.userUpdate).toHaveBeenCalledTimes(1);
    expect(m.savedUpdate).toHaveBeenCalledWith({
      where: { userId: { in: ['u1'] } },
      data: { lastNotifiedAt: expect.any(Date) },
    });
  });

  it('stops cleanly at the wall-clock deadline before selecting users', async () => {
    const r = await runDigest({ deadlineMs: -1 });
    expect(r).toEqual({ sent: 0, skipped: 0, failed: 0, stoppedEarly: true });
    expect(m.userFind).not.toHaveBeenCalled();
    expect(m.send).not.toHaveBeenCalled();
  });
});
