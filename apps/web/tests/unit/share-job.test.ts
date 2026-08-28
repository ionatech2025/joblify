import { vi, describe, it, expect, beforeEach } from 'vitest';
import type * as AuthModule from '@/lib/auth';

// Company shares a published job with a seeker in the directory (flowchart:
// "share job post link to job seekers of interest"): tenancy + published check,
// then an in-app JOB_SHARED notification that links to the public job page.

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
    jobFindFirst: vi.fn(),
    userFindFirst: vi.fn(),
    companyFindUnique: vi.fn(),
    notifCreate: vi.fn(),
    updateTag: vi.fn(),
  };
});

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return { ...actual, requireRole: m.requireRole, AuthError: m.AuthError };
});
vi.mock('@/lib/db', () => ({
  db: {
    jobPost: { findFirst: m.jobFindFirst },
    user: { findFirst: m.userFindFirst },
    companyProfile: { findUnique: m.companyFindUnique },
  },
}));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({ notification: { create: m.notifCreate } }),
}));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));

import { shareJobWithJobseeker, shareJobFromForm } from '@/app/actions/share-job';

const JOB_ID = '11111111-1111-1111-1111-111111111111';

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue({ id: 'company1', plan: 'PRO' });
  m.jobFindFirst.mockResolvedValue({
    id: JOB_ID,
    slug: 'senior-rust-engineer',
    title: 'Senior Rust Engineer',
  });
  m.userFindFirst.mockResolvedValue({ id: 'seeker1' });
  m.companyFindUnique.mockResolvedValue({ companyName: 'Acme' });
  m.notifCreate.mockResolvedValue({});
});

describe('shareJobWithJobseeker', () => {
  it('propagates the auth error for non-companies', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(shareJobWithJobseeker(JOB_ID, 'seeker1')).rejects.toThrow();
    expect(m.notifCreate).not.toHaveBeenCalled();
  });

  it('requires a Pro plan to share a job', async () => {
    m.requireRole.mockResolvedValue({ id: 'company1', plan: 'FREE' });
    await expect(shareJobWithJobseeker(JOB_ID, 'seeker1')).rejects.toThrow('UPGRADE_REQUIRED');
    expect(m.notifCreate).not.toHaveBeenCalled();
  });

  it("rejects sharing another company's (or unpublished) job", async () => {
    m.jobFindFirst.mockResolvedValue(null);
    await expect(shareJobWithJobseeker(JOB_ID, 'seeker1')).rejects.toThrow();
    expect(m.notifCreate).not.toHaveBeenCalled();
  });

  it('rejects when the target is not a job seeker', async () => {
    m.userFindFirst.mockResolvedValue(null);
    expect(await shareJobWithJobseeker(JOB_ID, 'seeker1')).toMatchObject({
      ok: false,
      error: expect.stringMatching('Job seeker not found'),
    });
    expect(m.notifCreate).not.toHaveBeenCalled();
  });

  it('notifies the seeker with a link to the public job page', async () => {
    await shareJobWithJobseeker(JOB_ID, 'seeker1');
    const notif = m.notifCreate.mock.calls[0]![0].data;
    expect(notif.userId).toBe('seeker1');
    expect(notif.kind).toBe('JOB_SHARED');
    expect(notif.payload.jobPostId).toBe(JOB_ID);
    expect(notif.payload.jobSlug).toBe('senior-rust-engineer');
    expect(m.updateTag).toHaveBeenCalledWith('user:seeker1:notifications');
  });
});

describe('shareJobFromForm', () => {
  it('parses the job id from the form and shares it', async () => {
    const fd = new FormData();
    fd.set('jobPostId', JOB_ID);
    await shareJobFromForm('seeker1', fd);
    expect(m.notifCreate).toHaveBeenCalledTimes(1);
  });

  it('rejects a non-uuid job id before touching the database', async () => {
    const fd = new FormData();
    fd.set('jobPostId', 'not-a-uuid');
    await expect(shareJobFromForm('seeker1', fd)).rejects.toThrow();
    expect(m.jobFindFirst).not.toHaveBeenCalled();
  });
});
