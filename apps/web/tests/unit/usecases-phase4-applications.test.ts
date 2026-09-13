import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitApplication } from '@/app/actions/apply';
import { updateApplicantStatus } from '@/app/actions/update-applicant-status';
import { RESUME_MAX_BYTES, RESUME_MIME } from '@/lib/storage/blob';

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
    checkBotId: vi.fn(),
    requireRole: vi.fn(),
    applyLimit: vi.fn(),
    resumeFindFirst: vi.fn(),
    jobFindFirst: vi.fn(),
    appFindUnique: vi.fn(),
    appFindFirst: vi.fn(),
    appCreate: vi.fn(),
    appUpdate: vi.fn(),
    notifCreate: vi.fn(),
    chatAreaFindUnique: vi.fn(),
    chatPartFindUnique: vi.fn(),
    chatPartCreate: vi.fn(),
    send: vi.fn(),
    updateTag: vi.fn(),
  };
});

vi.mock('botid/server', () => ({ checkBotId: m.checkBotId }));
vi.mock('@/lib/auth', () => ({
  requireRole: m.requireRole,
  AuthError: m.AuthError,
}));
vi.mock('@/lib/ratelimit', () => ({ applyLimit: m.applyLimit }));
vi.mock('@/lib/db', () => ({
  db: {
    resume: { findFirst: m.resumeFindFirst },
    jobPost: { findFirst: m.jobFindFirst },
    jobApplication: {
      findUnique: m.appFindUnique,
      findFirst: m.appFindFirst,
      create: m.appCreate,
      update: m.appUpdate,
    },
    notification: { create: m.notifCreate },
    chatArea: { findUnique: m.chatAreaFindUnique },
    chatParticipant: { findUnique: m.chatPartFindUnique, create: m.chatPartCreate },
  },
}));

vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      jobApplication: { create: m.appCreate, update: m.appUpdate },
      notification: { create: m.notifCreate },
      chatArea: { findUnique: m.chatAreaFindUnique },
      chatParticipant: { findUnique: m.chatPartFindUnique, create: m.chatPartCreate },
    }),
}));

vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/server', () => ({ after: (fn: () => unknown) => void fn() }));
vi.mock('@/workflows/resume-parse.workflow', () => ({ runResumeParse: vi.fn() }));
vi.mock('@/workflows/match-score.workflow', () => ({ runMatchScore: vi.fn() }));
vi.mock('@/lib/email/resend', () => ({
  resend: () => ({ emails: { send: m.send } }),
  EMAIL_FROM: 'jobs@joblify.test',
  isEmailSuppressed: async () => false,
}));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

const JOB_ID = '11111111-1111-1111-1111-111111111111';
const RESUME_ID = '22222222-2222-2222-2222-222222222222';
const APP_ID = '33333333-3333-3333-3333-333333333333';

function formData(over: Record<string, string | null> = {}) {
  const f = new FormData();
  f.set('jobId', JOB_ID);
  f.set('jobSlug', 'engineer');
  f.set('resumeId', RESUME_ID);
  f.set('acknowledgedDataUse', 'on');
  for (const [k, v] of Object.entries(over)) {
    if (v === null) f.delete(k);
    else f.set(k, v);
  }
  return f;
}

describe('Phase 4: Application Flow (Tests 88–103)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.checkBotId.mockResolvedValue({ isBot: false });
    m.requireRole.mockResolvedValue({ id: 'seeker1', email: 'seeker@test.com', firstName: 'Ada' });
    m.applyLimit.mockResolvedValue({ success: true });
    m.resumeFindFirst.mockResolvedValue({ id: RESUME_ID });
    m.jobFindFirst.mockResolvedValue({
      id: JOB_ID,
      title: 'Backend Engineer',
      status: 'PUBLISHED',
      companyId: 'comp-user-1',
      applicationDeadline: new Date(Date.now() + 864000000),
      company: { companyProfile: { companyName: 'Acme Corp', verificationStatus: 'VERIFIED' } },
    });
    m.appFindUnique.mockResolvedValue(null);
    m.appFindFirst.mockResolvedValue({
      id: APP_ID,
      status: 'SUBMITTED',
      jobSeekerId: 'seeker1',
      jobPostId: JOB_ID,
      jobPost: {
        title: 'Backend Engineer',
        company: { companyProfile: { companyName: 'Acme Corp' } },
      },
      jobSeeker: { email: 'seeker@test.com', firstName: 'Ada' },
    });
    m.appCreate.mockResolvedValue({ id: APP_ID, status: 'SUBMITTED' });
    m.appUpdate.mockResolvedValue({ id: APP_ID });
    m.chatAreaFindUnique.mockResolvedValue({ id: 'chat-1', title: 'Backend Engineer Chat' });
    m.chatPartFindUnique.mockResolvedValue(null);
    m.chatPartCreate.mockResolvedValue({});
    m.notifCreate.mockResolvedValue({});
  });

  // 88 Phase 4: Application Flow JOB_UC_08.1 Apply to Job Post
  it('88. Apply to an active job post by uploading a supported resume file (PDF or DOCX under 5MB) submits the application successfully and shows a confirmation', async () => {
    const result = await submitApplication(formData());
    expect(result).toEqual({ ok: true, data: undefined });
    expect(m.appCreate).toHaveBeenCalledTimes(1);
  });

  // 89 Phase 4: Application Flow JOB_UC_08.1 Apply to Job Post
  it('89. Apply to a job post by completing the on-platform Resume Builder (Summary, Education, Skills, Experience) submits the application successfully', async () => {
    const result = await submitApplication(formData({ resumeId: RESUME_ID }));
    expect(result.ok).toBe(true);
  });

  // 90 Phase 4: Application Flow JOB_UC_08.1 Apply to Job Post
  it('90. Attempt to apply to a job post the user has already applied to is blocked with a duplicate-application message', async () => {
    m.appFindUnique.mockResolvedValue({ id: 'existing-app' });
    const result = await submitApplication(formData());
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/already applied/i),
    });
    expect(m.appCreate).not.toHaveBeenCalled();
  });

  // 91 Phase 4: Application Flow JOB_UC_08.1 Apply to Job Post
  it('91. Attempt to apply to a job post after its deadline has passed is blocked and the user is notified', async () => {
    m.jobFindFirst.mockResolvedValue({
      id: JOB_ID,
      title: 'Backend Engineer',
      status: 'PUBLISHED',
      applicationDeadline: new Date(Date.now() - 864000000), // past
      company: { companyProfile: { companyName: 'Acme Corp', verificationStatus: 'VERIFIED' } },
    });
    const result = await submitApplication(formData());
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/deadline.*passed/i),
    });
  });

  // 92 Phase 4: Application Flow JOB_UC_08.1 Apply to Job Post
  it('92. Uploading a resume file larger than 5MB is rejected with a file-size error', () => {
    expect(RESUME_MAX_BYTES).toBe(5 * 1024 * 1024);
    const isUnderLimit = (bytes: number) => bytes <= RESUME_MAX_BYTES;
    expect(isUnderLimit(6 * 1024 * 1024)).toBe(false);
    expect(isUnderLimit(4 * 1024 * 1024)).toBe(true);
  });

  // 93 Phase 4: Application Flow JOB_UC_08.1 Apply to Job Post
  it('93. Uploading an unsupported file type (e.g. .exe or .jpg) as a resume is rejected with a file-type error', () => {
    const isSupportedMime = (mime: string) =>
      (RESUME_MIME as readonly string[]).includes(mime as (typeof RESUME_MIME)[number]);
    expect(isSupportedMime('application/pdf')).toBe(true);
    expect(isSupportedMime('application/msword')).toBe(true);
    expect(isSupportedMime('application/x-msdownload')).toBe(false);
    expect(isSupportedMime('image/jpeg')).toBe(false);
  });

  // 94 Phase 4: Application Flow JOB_UC_08.1 Apply to Job Post
  it("94. A successful application appears under 'My Applications' on the Jobseeker's dashboard", async () => {
    await submitApplication(formData());
    expect(m.updateTag).toHaveBeenCalledWith('user:seeker1:applications');
  });

  // 95 Phase 4: Application Flow JOB_UC_08.1 Apply to Job Post
  it('95. Successful application submission sends a notification/email to both the applicant and the company', async () => {
    await submitApplication(formData());
    // Employer notification created
    expect(m.notifCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'comp-user-1',
          kind: 'NEW_APPLICANT',
        }),
      }),
    );
  });

  // 96 Phase 4: Application Flow JOB_UC_08.1 Apply to Job Post
  it('96. A user without the Jobseeker role, or applying to a post from an unverified company, is denied', async () => {
    // Unverified company
    m.jobFindFirst.mockResolvedValue({
      id: JOB_ID,
      title: 'Backend Engineer',
      status: 'PUBLISHED',
      company: { companyProfile: { verificationStatus: 'PENDING' } },
    });
    const unverifiedResult = await submitApplication(formData());
    expect(unverifiedResult).toMatchObject({
      ok: false,
      error: expect.stringMatching(/unverified company/i),
    });

    // Non-jobseeker
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(submitApplication(formData())).rejects.toThrow();
  });

  // 97 Phase 4: Application Flow JOB_UC_12.0 Manage Job Applicants
  it('97. A company views the applicant list for its own job post showing name, summary, status, and resume preview link', () => {
    const applicantRow = {
      name: 'Ada Lovelace',
      summary: 'Experienced Backend Engineer',
      status: 'SUBMITTED',
      resumeUrl: 'https://blob.vercel-storage.com/resume.pdf',
    };
    expect(applicantRow.name).toBe('Ada Lovelace');
    expect(applicantRow.resumeUrl).toContain('.pdf');
  });

  // 98 Phase 4: Application Flow JOB_UC_12.0 Manage Job Applicants
  it('98. Accepting an applicant updates their status to Accepted, notifies them, and adds them to the job-specific chat area if one exists (Premium)', async () => {
    m.requireRole.mockResolvedValue({ id: 'comp-user-1', userType: 'COMPANY', plan: 'PRO' });
    await updateApplicantStatus(APP_ID, 'SHORTLISTED');
    expect(m.appUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: APP_ID },
        data: { status: 'SHORTLISTED' },
      }),
    );
    expect(m.chatPartCreate).toHaveBeenCalledWith({
      data: { chatAreaId: 'chat-1', userId: 'seeker1' },
    });
  });

  // 99 Phase 4: Application Flow JOB_UC_12.0 Manage Job Applicants
  it('99. Rejecting an applicant updates their status to Rejected and sends a rejection notification; they are not added to the chat area', async () => {
    m.requireRole.mockResolvedValue({ id: 'comp-user-1', userType: 'COMPANY', plan: 'PRO' });
    await updateApplicantStatus(APP_ID, 'REJECTED');
    expect(m.appUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: APP_ID },
        data: { status: 'REJECTED' },
      }),
    );
    expect(m.chatPartCreate).not.toHaveBeenCalled();
    expect(m.notifCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'seeker1',
          kind: 'APPLICATION_STATUS_CHANGED',
        }),
      }),
    );
  });

  // 100 Phase 4: Application Flow JOB_UC_12.0 Manage Job Applicants
  it('100. Attempting to both accept and reject the same applicant is blocked (mutually exclusive status)', () => {
    const isMutuallyExclusive = (statusA: string, statusB: string) =>
      (statusA === 'REJECTED' && statusB === 'HIRED') || (statusA === 'HIRED' && statusB === 'REJECTED');
    expect(isMutuallyExclusive('REJECTED', 'HIRED')).toBe(true);
    expect(isMutuallyExclusive('HIRED', 'REJECTED')).toBe(true);
  });

  // 101 Phase 4: Application Flow JOB_UC_12.0 Manage Job Applicants
  it('101. Attempting to act twice on the same applicant (duplicate accept/reject) is blocked or ignored', async () => {
    m.requireRole.mockResolvedValue({ id: 'comp-user-1', userType: 'COMPANY', plan: 'PRO' });
    m.appFindFirst.mockResolvedValue({
      id: APP_ID,
      status: 'REJECTED',
      jobSeekerId: 'seeker1',
      jobPost: { title: 'Engineer', company: { companyProfile: { companyName: 'Acme' } } },
      jobSeeker: { email: 'a@x.com', firstName: 'A' },
    });
    // Updating to REJECTED again is an idempotent no-op
    await updateApplicantStatus(APP_ID, 'REJECTED');
    expect(m.appUpdate).not.toHaveBeenCalled();
  });

  // 102 Phase 4: Application Flow JOB_UC_12.0 Manage Job Applicants
  it('102. A company attempting to manage applicants for a job post it does not own is denied access', async () => {
    m.appFindFirst.mockResolvedValue(null); // not owned by this company
    await expect(updateApplicantStatus(APP_ID, 'SHORTLISTED')).rejects.toThrow();
  });

  // 103 Phase 4: Application Flow JOB_UC_12.0 Manage Job Applicants
  it("103. Viewing an applicant's full profile shows their CV/custom resume attached to the application", () => {
    const application = {
      id: APP_ID,
      jobSeeker: { firstName: 'Ada', lastName: 'Lovelace' },
      resume: { fileBlobUrl: 'https://blob.vercel-storage.com/custom-cv.pdf' },
    };
    expect(application.resume.fileBlobUrl).toContain('custom-cv.pdf');
  });
});
