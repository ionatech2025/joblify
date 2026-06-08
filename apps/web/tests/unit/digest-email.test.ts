import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({ userFind: vi.fn(), jobFind: vi.fn(), send: vi.fn() }));

vi.mock('@/lib/db', () => ({ db: { user: { findMany: m.userFind }, jobPost: { findMany: m.jobFind } } }));
vi.mock('@/lib/email/resend', () => ({ resend: () => ({ emails: { send: m.send } }), EMAIL_FROM: 'no-reply@joblify.test' }));
vi.mock('@/lib/observability/logger', () => ({ logger: { warn: vi.fn() } }));

import { runDigest } from '@/workflows/digest-email.workflow';

const job = { slug: 'eng', title: 'Engineer', company: { companyProfile: { companyName: 'Acme' } } };

describe('runDigest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.send.mockResolvedValue({});
  });

  it('only targets consented, non-suppressed, non-deleted jobseekers', async () => {
    m.userFind.mockResolvedValue([]);
    await runDigest();
    const where = m.userFind.mock.calls[0]![0].where;
    expect(where.userType).toBe('JOB_SEEKER');
    expect(where.deletedAt).toBeNull();
    expect(where.emailSuppressedAt).toBeNull();
    expect(where.consentJson).toBeDefined(); // { not: Prisma.DbNull }
  });

  it('sends to users with new jobs and skips those without', async () => {
    m.userFind.mockResolvedValue([
      { id: 'u1', email: 'a@x.com', firstName: 'A', jobSeekerProfile: { headline: 'Dev' } },
      { id: 'u2', email: 'b@x.com', firstName: 'B', jobSeekerProfile: null },
    ]);
    m.jobFind.mockResolvedValue([]); // default: no new jobs
    m.jobFind.mockResolvedValueOnce([job]); // first user gets one
    const r = await runDigest();
    expect(r).toEqual({ sent: 1, skipped: 1 });
    expect(m.send).toHaveBeenCalledTimes(1);
    expect(m.send.mock.calls[0]![0].to).toBe('a@x.com');
  });

  it('counts a send failure as skipped, not sent', async () => {
    m.userFind.mockResolvedValue([{ id: 'u1', email: 'a@x.com', firstName: 'A', jobSeekerProfile: null }]);
    m.jobFind.mockResolvedValue([job]);
    m.send.mockRejectedValue(new Error('resend down'));
    const r = await runDigest();
    expect(r).toEqual({ sent: 0, skipped: 1 });
  });
});
