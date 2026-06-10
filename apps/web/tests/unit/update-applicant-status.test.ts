import { vi, describe, it, expect, beforeEach } from 'vitest';

// Money path (pipeline): company moves an applicant through stages — tenancy →
// audit'd status write + in-app notification → cache invalidation → best-effort
// email. Also covers recruiter notes.

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
    appFindFirst: vi.fn(),
    appUpdate: vi.fn(),
    notifCreate: vi.fn(),
    send: vi.fn(),
    updateTag: vi.fn(),
  };
});

vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole, AuthError: m.AuthError }));
vi.mock('@/lib/db', () => ({ db: { jobApplication: { findFirst: m.appFindFirst } } }));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({ jobApplication: { update: m.appUpdate }, notification: { create: m.notifCreate } }),
}));
vi.mock('@/lib/email/resend', () => ({
  resend: () => ({ emails: { send: m.send } }),
  EMAIL_FROM: 'x@joblify.test',
}));
vi.mock('@/lib/email/templates', () => ({
  statusChange: () => ({ subject: 's', text: 't', html: 'h' }),
}));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));

import { updateApplicantStatus, saveApplicantNote } from '@/app/actions/update-applicant-status';

const APP_ID = '33333333-3333-3333-3333-333333333333';

const APPLICATION = {
  id: APP_ID,
  status: 'SUBMITTED',
  jobSeekerId: 'seeker1',
  jobPostId: 'job1',
  jobSeeker: { email: 'seeker@x.com', firstName: 'Sam' },
  jobPost: { title: 'Engineer', company: { companyProfile: { companyName: 'Acme' } } },
};

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue({ id: 'company1' });
  m.appFindFirst.mockResolvedValue({ ...APPLICATION });
  m.appUpdate.mockResolvedValue({});
  m.notifCreate.mockResolvedValue({});
  m.send.mockResolvedValue({});
});

describe('updateApplicantStatus', () => {
  it('propagates the auth error for non-companies', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(updateApplicantStatus(APP_ID, 'SHORTLISTED')).rejects.toThrow();
    expect(m.appUpdate).not.toHaveBeenCalled();
  });

  it("rejects an application on another company's job (tenancy)", async () => {
    m.appFindFirst.mockResolvedValue(null);
    await expect(updateApplicantStatus(APP_ID, 'SHORTLISTED')).rejects.toThrow();
    expect(m.appUpdate).not.toHaveBeenCalled();
    expect(m.notifCreate).not.toHaveBeenCalled();
  });

  it('is a no-op when the status is unchanged', async () => {
    await updateApplicantStatus(APP_ID, 'SUBMITTED');
    expect(m.appUpdate).not.toHaveBeenCalled();
    expect(m.notifCreate).not.toHaveBeenCalled();
    expect(m.send).not.toHaveBeenCalled();
    expect(m.updateTag).not.toHaveBeenCalled();
  });

  it('writes the status and notifies the jobseeker on the happy path', async () => {
    await updateApplicantStatus(APP_ID, 'SHORTLISTED');
    expect(m.appUpdate).toHaveBeenCalledWith({ where: { id: APP_ID }, data: { status: 'SHORTLISTED' } });
    const notif = m.notifCreate.mock.calls[0]![0].data;
    expect(notif.userId).toBe('seeker1');
    expect(notif.kind).toBe('APPLICATION_STATUS_CHANGED');
    expect(notif.payload.status).toBe('SHORTLISTED');
    expect(notif.payload.jobTitle).toBe('Engineer');
  });

  it('invalidates the applicant, notification, and pipeline caches', async () => {
    await updateApplicantStatus(APP_ID, 'INTERVIEW_SCHEDULED');
    expect(m.updateTag).toHaveBeenCalledWith('user:seeker1:applications');
    expect(m.updateTag).toHaveBeenCalledWith('user:seeker1:notifications');
    expect(m.updateTag).toHaveBeenCalledWith('job:job1:applicants');
  });

  it('emails the jobseeker (best-effort, post-write)', async () => {
    await updateApplicantStatus(APP_ID, 'OFFER_EXTENDED');
    await vi.waitFor(() => expect(m.send).toHaveBeenCalledTimes(1));
    expect(m.send.mock.calls[0]![0].to).toBe('seeker@x.com');
  });

  it('does not fail the transition when the email send fails', async () => {
    m.send.mockRejectedValue(new Error('resend down'));
    await expect(updateApplicantStatus(APP_ID, 'REJECTED')).resolves.toBeUndefined();
    expect(m.appUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('saveApplicantNote', () => {
  it("rejects notes on another company's applicant (tenancy)", async () => {
    m.appFindFirst.mockResolvedValue(null);
    await expect(saveApplicantNote(APP_ID, 'great candidate')).rejects.toThrow();
    expect(m.appUpdate).not.toHaveBeenCalled();
  });

  it('saves the note and invalidates the pipeline cache', async () => {
    await saveApplicantNote(APP_ID, 'great candidate');
    expect(m.appUpdate.mock.calls[0]![0].data.recruiterNotes).toBe('great candidate');
    expect(m.updateTag).toHaveBeenCalledWith('job:job1:applicants');
  });

  it('truncates to 5000 chars and stores an empty note as null', async () => {
    await saveApplicantNote(APP_ID, 'x'.repeat(6000));
    expect(m.appUpdate.mock.calls[0]![0].data.recruiterNotes).toHaveLength(5000);
    await saveApplicantNote(APP_ID, '');
    expect(m.appUpdate.mock.calls[1]![0].data.recruiterNotes).toBeNull();
  });
});
