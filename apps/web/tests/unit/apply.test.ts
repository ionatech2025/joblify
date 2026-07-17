import { vi, describe, it, expect, beforeEach } from 'vitest';

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
    appCreate: vi.fn(),
    isEmailSuppressed: vi.fn(),
    send: vi.fn(),
    runResumeParse: vi.fn(),
    runMatchScore: vi.fn(),
  };
});

vi.mock('botid/server', () => ({ checkBotId: m.checkBotId }));
vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole, AuthError: m.AuthError }));
vi.mock('@/lib/ratelimit', () => ({ applyLimit: m.applyLimit }));
vi.mock('@/lib/db', () => ({
  db: {
    resume: { findFirst: m.resumeFindFirst },
    jobPost: { findFirst: m.jobFindFirst },
    jobApplication: { findUnique: m.appFindUnique },
  },
}));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({ jobApplication: { create: m.appCreate } }),
}));
vi.mock('@/lib/cache', () => ({ tags: { userApplications: () => 'u', jobApplicants: () => 'j' } }));
vi.mock('@/lib/email/resend', () => ({
  resend: () => ({ emails: { send: m.send } }),
  EMAIL_FROM: 'x@joblify.test',
  isEmailSuppressed: m.isEmailSuppressed,
}));
vi.mock('@/lib/email/templates', () => ({ applicationConfirm: () => ({ subject: 's', text: 't', html: 'h' }) }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
vi.mock('next/cache', () => ({ updateTag: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/server', () => ({ after: (_fn: () => unknown) => void 0 }));
vi.mock('@/workflows/resume-parse.workflow', () => ({ runResumeParse: m.runResumeParse }));
vi.mock('@/workflows/match-score.workflow', () => ({ runMatchScore: m.runMatchScore }));

import { submitApplication } from '@/app/actions/apply';

const JOB_ID = '11111111-1111-1111-1111-111111111111';
const RESUME_ID = '22222222-2222-2222-2222-222222222222';

function fd(over: Record<string, string | null> = {}) {
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

describe('submitApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.checkBotId.mockResolvedValue({ isBot: false });
    m.requireRole.mockResolvedValue({ id: 'user1', email: 'a@x.com', firstName: 'A' });
    m.applyLimit.mockResolvedValue({ success: true });
    m.resumeFindFirst.mockResolvedValue({ id: RESUME_ID });
    m.jobFindFirst.mockResolvedValue({
      id: JOB_ID,
      title: 'Engineer',
      company: { companyProfile: { companyName: 'Acme' } },
    });
    m.appFindUnique.mockResolvedValue(null);
    m.appCreate.mockResolvedValue({ id: 'app1', status: 'SUBMITTED' });
    m.isEmailSuppressed.mockResolvedValue(false);
    m.send.mockResolvedValue({});
  });

  it('rejects detected bots before creating anything', async () => {
    m.checkBotId.mockResolvedValue({ isBot: true });
    await expect(submitApplication(fd())).rejects.toThrow(/suspicious/i);
    expect(m.appCreate).not.toHaveBeenCalled();
  });

  it('propagates the auth error for non-jobseekers', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(submitApplication(fd())).rejects.toThrow();
    expect(m.appCreate).not.toHaveBeenCalled();
  });

  it('enforces the per-user daily rate limit', async () => {
    m.applyLimit.mockResolvedValue({ success: false });
    await expect(submitApplication(fd())).rejects.toThrow(/limit/i);
    expect(m.appCreate).not.toHaveBeenCalled();
  });

  it('rejects invalid input (non-uuid resume id)', async () => {
    await expect(submitApplication(fd({ resumeId: 'nope' }))).rejects.toThrow(/invalid/i);
    expect(m.appCreate).not.toHaveBeenCalled();
  });

  it('rejects a missing data-use acknowledgement', async () => {
    await expect(submitApplication(fd({ acknowledgedDataUse: null }))).rejects.toThrow(/invalid/i);
  });

  it('rejects a resume the user does not own', async () => {
    m.resumeFindFirst.mockResolvedValue(null);
    await expect(submitApplication(fd())).rejects.toThrow();
    expect(m.appCreate).not.toHaveBeenCalled();
  });

  it('rejects a job that is not live', async () => {
    m.jobFindFirst.mockResolvedValue(null);
    await expect(submitApplication(fd())).rejects.toThrow(/not available/i);
    expect(m.appCreate).not.toHaveBeenCalled();
  });

  it('rejects applying after the application deadline has passed', async () => {
    m.jobFindFirst.mockResolvedValue({
      id: JOB_ID,
      title: 'Engineer',
      applicationDeadline: new Date('2020-01-01T00:00:00Z'),
      company: { companyProfile: { companyName: 'Acme' } },
    });
    await expect(submitApplication(fd())).rejects.toThrow(/deadline/i);
    expect(m.appCreate).not.toHaveBeenCalled();
  });

  it('allows applying when the deadline is still in the future', async () => {
    m.jobFindFirst.mockResolvedValue({
      id: JOB_ID,
      title: 'Engineer',
      applicationDeadline: new Date('2099-01-01T00:00:00Z'),
      company: { companyProfile: { companyName: 'Acme' } },
    });
    await expect(submitApplication(fd())).resolves.toBeUndefined();
    expect(m.appCreate).toHaveBeenCalledTimes(1);
  });

  it('rejects a second application to the same job', async () => {
    m.appFindUnique.mockResolvedValue({ id: 'existing-app' });
    await expect(submitApplication(fd())).rejects.toThrow(/already applied/i);
    expect(m.appCreate).not.toHaveBeenCalled();
  });

  it('creates the application with the right ownership on the happy path', async () => {
    await submitApplication(fd({ coverLetter: 'hi' }));
    expect(m.appCreate).toHaveBeenCalledTimes(1);
    const data = m.appCreate.mock.calls[0]![0].data;
    expect(data.jobPostId).toBe(JOB_ID);
    expect(data.jobSeekerId).toBe('user1');
    expect(data.resumeId).toBe(RESUME_ID);
    expect(data.coverLetter).toBe('hi');
    expect(data.status).toBe('SUBMITTED');
  });
});
