import { vi, describe, it, expect, beforeEach } from 'vitest';

// Trust & safety: an ADMIN verifies or rejects a company's self-submitted
// profile. First real capability behind the ADMIN role — see app/admin.

const m = vi.hoisted(() => {
  class AuthError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.name = 'AuthError';
      this.code = code;
    }
  }
  return {
    AuthError,
    requireRole: vi.fn(),
    profileFindUnique: vi.fn(),
    profileUpdate: vi.fn(),
    notifCreate: vi.fn(),
    updateTag: vi.fn(),
    reportFindUnique: vi.fn(),
    reportUpdate: vi.fn(),
    reportUpdateMany: vi.fn(),
    jobUpdate: vi.fn(),
    reindexJob: vi.fn(),
    afterCallbacks: [] as Array<() => unknown>,
  };
});

vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole, AuthError: m.AuthError }));
vi.mock('@/lib/db', () => ({
  db: {
    companyProfile: { findUnique: m.profileFindUnique },
    jobReport: { findUnique: m.reportFindUnique },
  },
}));
vi.mock('@/lib/search/index-job', () => ({ reindexJob: m.reindexJob }));
vi.mock('next/server', () => ({
  after: (fn: () => unknown) => {
    m.afterCallbacks.push(fn);
  },
}));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      companyProfile: { update: m.profileUpdate },
      notification: { create: m.notifCreate },
      jobReport: { update: m.reportUpdate, updateMany: m.reportUpdateMany },
      jobPost: { update: m.jobUpdate },
    }),
}));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

import { verifyCompany, resolveJobReport } from '@/app/actions/admin';

const PROFILE_ID = '11111111-1111-1111-1111-111111111111';

beforeEach(() => {
  vi.clearAllMocks();
  m.afterCallbacks.length = 0;
  m.requireRole.mockResolvedValue({ id: 'admin1' });
  m.profileFindUnique.mockResolvedValue({
    id: PROFILE_ID,
    userId: 'company1',
    companyName: 'Acme Inc',
    verificationStatus: 'PENDING',
  });
  m.profileUpdate.mockResolvedValue({});
  m.notifCreate.mockResolvedValue({});
});

describe('verifyCompany', () => {
  it('propagates the auth error for non-admins', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(verifyCompany(PROFILE_ID, 'VERIFIED')).rejects.toThrow();
    expect(m.profileUpdate).not.toHaveBeenCalled();
  });

  it('rejects an unknown company profile', async () => {
    m.profileFindUnique.mockResolvedValue(null);
    expect(await verifyCompany(PROFILE_ID, 'VERIFIED')).toMatchObject({
      ok: false,
      error: expect.stringMatching('not found'),
    });
    expect(m.profileUpdate).not.toHaveBeenCalled();
  });

  it('verifies a company and notifies it', async () => {
    await verifyCompany(PROFILE_ID, 'VERIFIED');
    expect(m.profileUpdate.mock.calls[0]![0].data.verificationStatus).toBe('VERIFIED');
    const notif = m.notifCreate.mock.calls[0]![0].data;
    expect(notif.userId).toBe('company1');
    expect(notif.kind).toBe('ACCOUNT_UPDATE');
    expect(notif.payload.message).toMatch(/verified/i);
    expect(m.updateTag).toHaveBeenCalledWith('company:company1');
    expect(m.updateTag).toHaveBeenCalledWith('companies');
    expect(m.updateTag).toHaveBeenCalledWith('user:company1:notifications');
  });

  it('rejects a company and includes the reason in the notification', async () => {
    await verifyCompany(PROFILE_ID, 'REJECTED', 'Missing business registration');
    expect(m.profileUpdate.mock.calls[0]![0].data.verificationStatus).toBe('REJECTED');
    const notif = m.notifCreate.mock.calls[0]![0].data;
    expect(notif.payload.message).toContain('Missing business registration');
  });
});

describe('resolveJobReport', () => {
  const REPORT = {
    id: 'rep1',
    status: 'OPEN',
    jobPostId: 'job1',
    jobPost: { id: 'job1', title: 'Quick money job', companyId: 'company1', deletedAt: null },
  };

  beforeEach(() => {
    m.reportFindUnique.mockResolvedValue({ ...REPORT });
    m.reportUpdate.mockResolvedValue({});
    m.reportUpdateMany.mockResolvedValue({ count: 2 });
    m.jobUpdate.mockResolvedValue({});
    m.reindexJob.mockResolvedValue(undefined);
  });

  it('is admin-only', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(resolveJobReport('rep1', 'ACTIONED')).rejects.toThrow();
    expect(m.jobUpdate).not.toHaveBeenCalled();
  });

  it('ACTIONED removes the job at once, resolves every open report on it, and tells the company', async () => {
    const res = await resolveJobReport('rep1', 'ACTIONED');
    expect(res).toEqual({ ok: true, data: undefined });
    expect(m.jobUpdate).toHaveBeenCalledWith({
      where: { id: 'job1' },
      data: { status: 'ARCHIVED', deletedAt: expect.any(Date) },
    });
    expect(m.reportUpdateMany).toHaveBeenCalledWith({
      where: { jobPostId: 'job1', status: 'OPEN' },
      data: { status: 'ACTIONED', resolvedAt: expect.any(Date), resolvedBy: 'admin1' },
    });
    expect(m.notifCreate.mock.calls[0]![0].data).toMatchObject({
      userId: 'company1',
      kind: 'ACCOUNT_UPDATE',
    });
    // de-indexed off the response path
    expect(m.afterCallbacks).toHaveLength(1);
    await m.afterCallbacks[0]!();
    expect(m.reindexJob).toHaveBeenCalledWith('job1');
  });

  it('DISMISSED closes only that report and leaves the job alone', async () => {
    await resolveJobReport('rep1', 'DISMISSED');
    expect(m.reportUpdate).toHaveBeenCalledWith({
      where: { id: 'rep1' },
      data: { status: 'DISMISSED', resolvedAt: expect.any(Date), resolvedBy: 'admin1' },
    });
    expect(m.jobUpdate).not.toHaveBeenCalled();
    expect(m.notifCreate).not.toHaveBeenCalled();
    expect(m.afterCallbacks).toHaveLength(0);
  });

  it('is idempotent for an already-resolved report', async () => {
    m.reportFindUnique.mockResolvedValue({ ...REPORT, status: 'ACTIONED' });
    expect(await resolveJobReport('rep1', 'ACTIONED')).toEqual({ ok: true, data: undefined });
    expect(m.jobUpdate).not.toHaveBeenCalled();
  });

  it('reports an unknown id as an expected failure', async () => {
    m.reportFindUnique.mockResolvedValue(null);
    expect(await resolveJobReport('nope', 'DISMISSED')).toMatchObject({ ok: false });
  });
});
