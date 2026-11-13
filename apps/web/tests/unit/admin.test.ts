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
    profileFindFirst: vi.fn(),
    profileUpdateMany: vi.fn(),
    notifCreate: vi.fn(),
    notifCreateMany: vi.fn(),
    auditMeta: [] as Array<{ after?: (r: unknown) => unknown }>,
    isEmailSuppressed: vi.fn(),
    sendEmail: vi.fn(),
    updateTag: vi.fn(),
    reportFindUnique: vi.fn(),
    reportUpdateMany: vi.fn(),
    jobUpdate: vi.fn(),
    reindexJob: vi.fn(),
    afterCallbacks: [] as Array<() => unknown>,
  };
});

vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole, AuthError: m.AuthError }));
vi.mock('@/lib/db', () => ({
  db: {
    companyProfile: { findUnique: m.profileFindUnique, findFirst: m.profileFindFirst },
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
      jobReport: { updateMany: m.reportUpdateMany },
      jobPost: { update: m.jobUpdate },
    });
  },
}));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

import { verifyCompany, resolveJobReport } from '@/app/actions/admin';
import { updateCompanyProfile } from '@/app/actions/company';

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

const LOADED_AT = '2026-11-01T09:00:00.000Z';
const verify = () => verifyCompany(PROFILE_ID, { status: 'VERIFIED' }, LOADED_AT);
const reject = (reason: string | undefined) =>
  verifyCompany(PROFILE_ID, { status: 'REJECTED', reason: reason as string }, LOADED_AT);

async function runAfter() {
  for (const fn of m.afterCallbacks) await fn();
}

describe('verifyCompany', () => {
  it('propagates the auth error for non-admins', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(verify()).rejects.toThrow();
    expect(m.profileUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects an unknown company profile', async () => {
    m.profileFindUnique.mockResolvedValue(null);
    expect(await verify()).toMatchObject({
      ok: false,
      error: expect.stringMatching('not found'),
    });
    expect(m.profileUpdateMany).not.toHaveBeenCalled();
  });

  it('verifies a pending company, clears any old reason, and notifies it', async () => {
    expect(await verify()).toEqual({ ok: true, data: undefined });
    expect(m.profileUpdateMany).toHaveBeenCalledWith({
      where: { id: PROFILE_ID, verificationStatus: 'PENDING', updatedAt: new Date(LOADED_AT) },
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
    await reject('  Missing business registration  ');
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
    const res = await reject(reason);
    expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/reason/i) });
    expect(m.profileUpdateMany).not.toHaveBeenCalled();
    expect(m.notifCreate).not.toHaveBeenCalled();
  });

  it.each([undefined, 'not a date'])(
    'refuses a decision not bound to the version the admin reviewed (%j)',
    async (loadedAt) => {
      const res = await verifyCompany(PROFILE_ID, { status: 'VERIFIED' }, loadedAt as string);
      expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/reload/i) });
      expect(m.profileUpdateMany).not.toHaveBeenCalled();
    },
  );

  it('refuses a decision on a company that is no longer pending (stale tab, second admin)', async () => {
    m.profileFindUnique.mockResolvedValue({
      id: PROFILE_ID,
      userId: 'company1',
      companyName: 'Acme Inc',
      verificationStatus: 'VERIFIED',
      user: { email: 'owner@acme.test', firstName: 'Ada' },
    });
    m.profileUpdateMany.mockResolvedValue({ count: 0 });
    const res = await reject('Website does not resolve');
    expect(res).toMatchObject({
      ok: false,
      error:
        'This company changed or was reviewed since you loaded the queue. Reload to see the latest.',
    });
    expect(m.notifCreate).not.toHaveBeenCalled();
    expect(m.updateTag).not.toHaveBeenCalled();
    expect(m.afterCallbacks).toHaveLength(0);
  });

  it('refuses a stale approval after another admin rejected and the company resubmitted unchanged', async () => {
    const row = {
      id: PROFILE_ID,
      userId: 'company1',
      logoUrl: null,
      companyName: 'Acme Inc',
      website: 'https://acme.test',
      verificationStatus: 'PENDING',
      rejectionReason: null as string | null,
      updatedAt: new Date(LOADED_AT),
      user: { email: 'owner@acme.test', firstName: 'Ada' },
    };
    m.profileFindUnique.mockImplementation(async () => ({ ...row }));
    m.profileFindFirst.mockResolvedValue(null);
    // Matches the way Postgres filters and Prisma stamps @updatedAt on every write.
    m.profileUpdateMany.mockImplementation(
      async ({ where, data }: { where: Record<string, unknown>; data: object }) => {
        const current = row as Record<string, unknown>;
        const matches = Object.entries(where).every(([key, value]) =>
          value instanceof Date
            ? (current[key] as Date).getTime() === value.getTime()
            : current[key] === value,
        );
        if (!matches) return { count: 0 };
        Object.assign(row, data, { updatedAt: new Date(row.updatedAt.getTime() + 1000) });
        return { count: 1 };
      },
    );

    const adminA = row.updatedAt.toISOString();
    const adminB = row.updatedAt.toISOString();
    expect(
      await verifyCompany(PROFILE_ID, { status: 'REJECTED', reason: 'No registration' }, adminB),
    ).toMatchObject({ ok: true });
    expect(
      await updateCompanyProfile({
        companyName: row.companyName,
        industry: 'TECHNOLOGY',
        companySize: 'SIZE_11_50',
        description: 'Warehouse robots for East African logistics firms.',
        website: row.website,
      }),
    ).toMatchObject({ ok: true });
    expect(row).toMatchObject({ verificationStatus: 'PENDING', companyName: 'Acme Inc' });
    m.notifCreate.mockClear();

    const res = await verifyCompany(PROFILE_ID, { status: 'VERIFIED' }, adminA);
    expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/reload/i) });
    expect(row.verificationStatus).toBe('PENDING');
    expect(m.notifCreate).not.toHaveBeenCalled();
  });

  it('emails the company owner when it is verified', async () => {
    await verify();
    expect(m.sendEmail).not.toHaveBeenCalled();
    await runAfter();
    const mail = m.sendEmail.mock.calls[0]![0];
    expect(mail.to).toBe('owner@acme.test');
    expect(mail.subject).toMatch(/Acme Inc is verified/);
    expect(mail.text).toContain('Hi Ada');
  });

  it('emails the reason and the resubmit link when it is rejected', async () => {
    await reject('Website does not resolve');
    await runAfter();
    const mail = m.sendEmail.mock.calls[0]![0];
    expect(mail.to).toBe('owner@acme.test');
    expect(mail.text).toContain('Reason: Website does not resolve');
    expect(mail.text).toContain('/employer-setup');
  });

  it('does not email a suppressed address', async () => {
    m.isEmailSuppressed.mockResolvedValue(true);
    await verify();
    await runAfter();
    expect(m.sendEmail).not.toHaveBeenCalled();
  });

  it('still succeeds when email cannot be sent (no RESEND_API_KEY)', async () => {
    m.sendEmail.mockRejectedValue(new Error('RESEND_API_KEY not set'));
    expect(await verify()).toEqual({ ok: true, data: undefined });
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
    m.reportUpdateMany.mockResolvedValue({ count: 2 });
    m.jobUpdate.mockResolvedValue({});
    m.reindexJob.mockResolvedValue(undefined);
  });

  it('is admin-only', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(
      resolveJobReport('rep1', { outcome: 'ACTIONED', reason: 'Scam' }),
    ).rejects.toThrow();
    expect(m.jobUpdate).not.toHaveBeenCalled();
  });

  it.each([undefined, '  '])('refuses to remove a job without a reason (%j)', async (reason) => {
    const res = await resolveJobReport('rep1', { outcome: 'ACTIONED', reason: reason as string });
    expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/reason/i) });
    expect(m.jobUpdate).not.toHaveBeenCalled();
    expect(m.reportUpdateMany).not.toHaveBeenCalled();
  });

  it('records the removal reason in the audit event', async () => {
    await resolveJobReport('rep1', {
      outcome: 'ACTIONED',
      reason: 'Asks applicants for a registration fee',
    });
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
    await resolveJobReport('rep1', { outcome: 'ACTIONED', reason: 'Scam' });
    const { data } = m.notifCreateMany.mock.calls[0]![0];
    expect(data.map((n: { userId: string }) => n.userId)).toEqual(['seeker1', 'seeker2']);
    expect(data[0]).toMatchObject({ kind: 'SYSTEM', payload: { jobId: 'job1' } });
    expect(data[0].payload.message).toMatch(/Quick money job.*safety review.*do not send money/i);
    expect(m.updateTag).toHaveBeenCalledWith('user:seeker1:notifications');
    expect(m.updateTag).toHaveBeenCalledWith('user:seeker2:notifications');
  });

  it('ACTIONED removes the job at once, resolves every open report on it, and tells the company', async () => {
    const res = await resolveJobReport('rep1', { outcome: 'ACTIONED', reason: 'Scam' });
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
    m.reportUpdateMany.mockResolvedValue({ count: 1 });
    expect(await resolveJobReport('rep1', { outcome: 'DISMISSED' })).toEqual({
      ok: true,
      data: undefined,
    });
    expect(m.reportUpdateMany).toHaveBeenCalledWith({
      where: { id: 'rep1', status: 'OPEN' },
      data: { status: 'DISMISSED', resolvedAt: expect.any(Date), resolvedBy: 'admin1' },
    });
    expect(m.jobUpdate).not.toHaveBeenCalled();
    expect(m.notifCreate).not.toHaveBeenCalled();
    expect(m.notifCreateMany).not.toHaveBeenCalled();
    expect(m.afterCallbacks).toHaveLength(0);
  });

  const ALREADY_RESOLVED = {
    ok: false,
    error: 'This report was resolved since you loaded the queue. Reload to see the latest.',
  };

  it('refuses a stale tab deciding a report that is already resolved', async () => {
    m.reportFindUnique.mockResolvedValue({ ...REPORT, status: 'DISMISSED' });
    expect(await resolveJobReport('rep1', { outcome: 'ACTIONED', reason: 'Scam' })).toEqual(
      ALREADY_RESOLVED,
    );
    expect(m.reportUpdateMany).not.toHaveBeenCalled();
    expect(m.jobUpdate).not.toHaveBeenCalled();
  });

  it.each([
    ['removes', { outcome: 'ACTIONED' as const, reason: 'Scam' }],
    ['dismisses', { outcome: 'DISMISSED' as const }],
  ])(
    'when another admin resolves it first, %s nothing, notifies no one and keeps the job listed',
    async (_verb, resolution) => {
      m.reportUpdateMany.mockResolvedValue({ count: 0 });
      expect(await resolveJobReport('rep1', resolution)).toEqual(ALREADY_RESOLVED);
      expect(m.jobUpdate).not.toHaveBeenCalled();
      expect(m.notifCreate).not.toHaveBeenCalled();
      expect(m.notifCreateMany).not.toHaveBeenCalled();
      expect(m.updateTag).not.toHaveBeenCalled();
      expect(m.afterCallbacks).toHaveLength(0);
    },
  );

  it('reports an unknown id as an expected failure', async () => {
    m.reportFindUnique.mockResolvedValue(null);
    expect(await resolveJobReport('nope', { outcome: 'DISMISSED' })).toMatchObject({ ok: false });
  });
});
