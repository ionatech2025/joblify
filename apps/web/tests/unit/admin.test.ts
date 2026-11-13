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
    profileUpdateMany: vi.fn(),
    notifCreate: vi.fn(),
    notifCreateMany: vi.fn(),
    auditMeta: [] as Array<{ after?: (r: unknown) => unknown }>,
    isEmailSuppressed: vi.fn(),
    sendEmail: vi.fn(),
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
vi.mock('@/lib/email/resend', () => ({
  EMAIL_FROM: 'Joblify <noreply@test>',
  isEmailSuppressed: m.isEmailSuppressed,
  resend: () => ({ emails: { send: m.sendEmail } }),
}));
vi.mock('@/lib/audit', () => ({
  withAudit: (
    _ctx: unknown,
    meta: { after?: (r: unknown) => unknown },
    fn: (tx: unknown) => unknown,
  ) => {
    m.auditMeta.push(meta);
    return fn({
      companyProfile: { updateMany: m.profileUpdateMany },
      notification: { create: m.notifCreate, createMany: m.notifCreateMany },
      jobReport: { update: m.reportUpdate, updateMany: m.reportUpdateMany },
      jobPost: { update: m.jobUpdate },
    });
  },
}));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

import { verifyCompany, resolveJobReport } from '@/app/actions/admin';

const PROFILE_ID = '11111111-1111-1111-1111-111111111111';

beforeEach(() => {
  vi.clearAllMocks();
  m.afterCallbacks.length = 0;
  m.auditMeta.length = 0;
  m.requireRole.mockResolvedValue({ id: 'admin1' });
  m.profileFindUnique.mockResolvedValue({
    id: PROFILE_ID,
    userId: 'company1',
    companyName: 'Acme Inc',
    verificationStatus: 'PENDING',
    user: { email: 'owner@acme.test', firstName: 'Ada' },
  });
  m.profileUpdateMany.mockResolvedValue({ count: 1 });
  m.notifCreate.mockResolvedValue({});
  m.notifCreateMany.mockResolvedValue({ count: 0 });
  m.isEmailSuppressed.mockResolvedValue(false);
  m.sendEmail.mockResolvedValue({});
});

async function runAfter() {
  for (const fn of m.afterCallbacks) await fn();
}

describe('verifyCompany', () => {
  it('propagates the auth error for non-admins', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(verifyCompany(PROFILE_ID, 'VERIFIED')).rejects.toThrow();
    expect(m.profileUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects an unknown company profile', async () => {
    m.profileFindUnique.mockResolvedValue(null);
    expect(await verifyCompany(PROFILE_ID, 'VERIFIED')).toMatchObject({
      ok: false,
      error: expect.stringMatching('not found'),
    });
    expect(m.profileUpdateMany).not.toHaveBeenCalled();
  });

  it('verifies a pending company, clears any old reason, and notifies it', async () => {
    expect(await verifyCompany(PROFILE_ID, 'VERIFIED')).toEqual({ ok: true, data: undefined });
    expect(m.profileUpdateMany).toHaveBeenCalledWith({
      where: { id: PROFILE_ID, verificationStatus: 'PENDING' },
      data: { verificationStatus: 'VERIFIED', rejectionReason: null, reviewedAt: expect.any(Date) },
    });
    const notif = m.notifCreate.mock.calls[0]![0].data;
    expect(notif.userId).toBe('company1');
    expect(notif.kind).toBe('ACCOUNT_UPDATE');
    expect(notif.payload.message).toMatch(/verified/i);
    expect(m.updateTag).toHaveBeenCalledWith('company:company1');
    expect(m.updateTag).toHaveBeenCalledWith('companies');
    expect(m.updateTag).toHaveBeenCalledWith('user:company1:notifications');
  });

  it('rejects a company, stores the reason it will read, and includes it in the notification', async () => {
    await verifyCompany(PROFILE_ID, 'REJECTED', '  Missing business registration  ');
    expect(m.profileUpdateMany.mock.calls[0]![0].data).toMatchObject({
      verificationStatus: 'REJECTED',
      rejectionReason: 'Missing business registration',
    });
    const notif = m.notifCreate.mock.calls[0]![0].data;
    expect(notif.payload.message).toContain('Missing business registration');
    expect(m.auditMeta[0]!.after!(undefined)).toEqual({
      verificationStatus: 'REJECTED',
      reason: 'Missing business registration',
    });
  });

  it.each([undefined, '', '   '])('refuses a rejection without a reason (%j)', async (reason) => {
    const res = await verifyCompany(PROFILE_ID, 'REJECTED', reason);
    expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/reason/i) });
    expect(m.profileUpdateMany).not.toHaveBeenCalled();
    expect(m.notifCreate).not.toHaveBeenCalled();
  });

  it('refuses a decision on a company that is no longer pending (stale tab, second admin)', async () => {
    m.profileUpdateMany.mockResolvedValue({ count: 0 });
    const res = await verifyCompany(PROFILE_ID, 'REJECTED', 'Website does not resolve');
    expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/already reviewed/i) });
    expect(m.notifCreate).not.toHaveBeenCalled();
    expect(m.updateTag).not.toHaveBeenCalled();
    expect(m.afterCallbacks).toHaveLength(0);
  });

  it('emails the company owner when it is verified', async () => {
    await verifyCompany(PROFILE_ID, 'VERIFIED');
    expect(m.sendEmail).not.toHaveBeenCalled();
    await runAfter();
    const mail = m.sendEmail.mock.calls[0]![0];
    expect(mail.to).toBe('owner@acme.test');
    expect(mail.subject).toMatch(/Acme Inc is verified/);
    expect(mail.text).toContain('Hi Ada');
  });

  it('emails the reason and the resubmit link when it is rejected', async () => {
    await verifyCompany(PROFILE_ID, 'REJECTED', 'Website does not resolve');
    await runAfter();
    const mail = m.sendEmail.mock.calls[0]![0];
    expect(mail.to).toBe('owner@acme.test');
    expect(mail.text).toContain('Reason: Website does not resolve');
    expect(mail.text).toContain('/employer-setup');
  });

  it('does not email a suppressed address', async () => {
    m.isEmailSuppressed.mockResolvedValue(true);
    await verifyCompany(PROFILE_ID, 'VERIFIED');
    await runAfter();
    expect(m.sendEmail).not.toHaveBeenCalled();
  });

  it('still succeeds when email cannot be sent (no RESEND_API_KEY)', async () => {
    m.sendEmail.mockRejectedValue(new Error('RESEND_API_KEY not set'));
    expect(await verifyCompany(PROFILE_ID, 'VERIFIED')).toEqual({ ok: true, data: undefined });
    await expect(runAfter()).resolves.toBeUndefined();
  });
});

describe('resolveJobReport', () => {
  const REPORT = {
    id: 'rep1',
    status: 'OPEN',
    jobPostId: 'job1',
    jobPost: {
      id: 'job1',
      title: 'Quick money job',
      companyId: 'company1',
      deletedAt: null as Date | null,
      applications: [{ jobSeekerId: 'seeker1' }, { jobSeekerId: 'seeker2' }],
    },
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
    await expect(resolveJobReport('rep1', 'ACTIONED', 'Scam')).rejects.toThrow();
    expect(m.jobUpdate).not.toHaveBeenCalled();
  });

  it.each([undefined, '  '])('refuses to remove a job without a reason (%j)', async (reason) => {
    const res = await resolveJobReport('rep1', 'ACTIONED', reason);
    expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/reason/i) });
    expect(m.jobUpdate).not.toHaveBeenCalled();
    expect(m.reportUpdateMany).not.toHaveBeenCalled();
  });

  it('records the removal reason in the audit event', async () => {
    await resolveJobReport('rep1', 'ACTIONED', 'Asks applicants for a registration fee');
    expect(m.auditMeta[0]!.after!(undefined)).toEqual({
      reportId: 'rep1',
      outcome: 'ACTIONED',
      reason: 'Asks applicants for a registration fee',
    });
  });

  it('warns every applicant of a removed job, even one the company had already archived', async () => {
    m.reportFindUnique.mockResolvedValue({
      ...REPORT,
      jobPost: { ...REPORT.jobPost, deletedAt: new Date() },
    });
    await resolveJobReport('rep1', 'ACTIONED', 'Scam');
    const { data } = m.notifCreateMany.mock.calls[0]![0];
    expect(data.map((n: { userId: string }) => n.userId)).toEqual(['seeker1', 'seeker2']);
    expect(data[0]).toMatchObject({ kind: 'SYSTEM', payload: { jobId: 'job1' } });
    expect(data[0].payload.message).toMatch(/Quick money job.*safety review.*do not send money/i);
    expect(m.updateTag).toHaveBeenCalledWith('user:seeker1:notifications');
    expect(m.updateTag).toHaveBeenCalledWith('user:seeker2:notifications');
  });

  it('ACTIONED removes the job at once, resolves every open report on it, and tells the company', async () => {
    const res = await resolveJobReport('rep1', 'ACTIONED', 'Scam');
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
    expect(m.notifCreateMany).not.toHaveBeenCalled();
    expect(m.afterCallbacks).toHaveLength(0);
  });

  it('is idempotent for an already-resolved report', async () => {
    m.reportFindUnique.mockResolvedValue({ ...REPORT, status: 'ACTIONED' });
    expect(await resolveJobReport('rep1', 'ACTIONED', 'Scam')).toEqual({
      ok: true,
      data: undefined,
    });
    expect(m.jobUpdate).not.toHaveBeenCalled();
  });

  it('reports an unknown id as an expected failure', async () => {
    m.reportFindUnique.mockResolvedValue(null);
    expect(await resolveJobReport('nope', 'DISMISSED')).toMatchObject({ ok: false });
  });
});
