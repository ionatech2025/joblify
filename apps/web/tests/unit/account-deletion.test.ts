import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userUpdate: vi.fn(),
  jobUpdateMany: vi.fn(),
  jobFindMany: vi.fn(),
  deleteUser: vi.fn(),
  deleteJob: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireUser: m.requireUser }));
vi.mock('@/lib/db', () => ({ db: { jobPost: { findMany: m.jobFindMany } } }));
vi.mock('@/lib/audit', () => ({
  withAudit: (_c: unknown, _m: unknown, fn: (tx: unknown) => unknown) =>
    fn({ user: { update: m.userUpdate }, jobPost: { updateMany: m.jobUpdateMany } }),
}));
vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: async () => ({ users: { deleteUser: m.deleteUser } }),
}));
vi.mock('@/lib/search/algolia', () => ({ deleteJob: m.deleteJob }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/navigation', () => ({ redirect: m.redirect }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

import { deleteMyAccount } from '@/app/actions/account';

const SEEKER = { id: 'u1', email: 'a@x.test', userType: 'JOB_SEEKER', clerkUserId: 'user_1' };
const COMPANY = { id: 'c1', email: 'hr@acme.test', userType: 'COMPANY', clerkUserId: 'user_c' };

beforeEach(() => {
  vi.clearAllMocks();
  m.userUpdate.mockResolvedValue({});
  m.jobUpdateMany.mockResolvedValue({ count: 3 });
  m.jobFindMany.mockResolvedValue([{ id: 'j1' }, { id: 'j2' }]);
  m.deleteUser.mockResolvedValue({});
  m.deleteJob.mockResolvedValue(undefined);
});

describe('deleteMyAccount', () => {
  it('requires the exact email as confirmation', async () => {
    m.requireUser.mockResolvedValue(SEEKER);
    const res = await deleteMyAccount('someone@else.test');
    expect(res).toMatchObject({ ok: false });
    expect(m.userUpdate).not.toHaveBeenCalled();
  });

  it('soft-deletes and switches the digest off', async () => {
    m.requireUser.mockResolvedValue(SEEKER);
    await deleteMyAccount('a@x.test');
    expect(m.userUpdate).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { deletedAt: expect.any(Date), digestOptIn: false },
    });
    expect(m.jobUpdateMany).not.toHaveBeenCalled(); // job seekers own no postings
    expect(m.deleteUser).toHaveBeenCalledWith('user_1');
    expect(m.redirect).toHaveBeenCalledWith('/?account_deleted=1');
  });

  it('closes a company’s postings IMMEDIATELY, not after the 30-day sweep', async () => {
    m.requireUser.mockResolvedValue(COMPANY);
    await deleteMyAccount('hr@acme.test');
    expect(m.jobUpdateMany).toHaveBeenCalledWith({
      where: { companyId: 'c1', deletedAt: null },
      data: { status: 'ARCHIVED', deletedAt: expect.any(Date) },
    });
    // …and removes them from the search index.
    expect(m.deleteJob).toHaveBeenCalledTimes(2);
  });

  it('does not let a Clerk outage block erasure', async () => {
    m.requireUser.mockResolvedValue(SEEKER);
    m.deleteUser.mockRejectedValue(new Error('clerk 503'));
    await deleteMyAccount('a@x.test');
    expect(m.userUpdate).toHaveBeenCalled();
    expect(m.redirect).toHaveBeenCalled();
  });
});
