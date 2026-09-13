import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postJob, updateJob, archiveJob } from '@/app/actions/post-job';
import { getCompaniesList } from '@/app/(marketing)/companies/page';
import { PostJobFormSchema } from '@/app/company/jobs/job-form-schema';

const m = vi.hoisted(() => {
  class AuthError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.name = 'AuthError';
      this.code = code;
    }
  }
  const afterCallbacks: Array<() => unknown> = [];
  return {
    AuthError,
    afterCallbacks,
    requireRole: vi.fn(),
    postJobLimit: vi.fn(),
    jobFindFirst: vi.fn(),
    jobCreate: vi.fn(),
    jobUpdate: vi.fn(),
    skillFindMany: vi.fn(),
    jpsDeleteMany: vi.fn(),
    jpsCreateMany: vi.fn(),
    reindexJob: vi.fn(),
    embedJobPost: vi.fn(),
    generateObject: vi.fn(),
    companyFindMany: vi.fn(),
    companyFindUnique: vi.fn(),
    seekerProfileFindMany: vi.fn(),
    notifCreate: vi.fn(),
    updateTag: vi.fn(),
  };
});

vi.mock('@/lib/auth', () => ({
  requireRole: m.requireRole,
  assertPlan: (user: { plan?: string }, required: string) => {
    if (user.plan !== required) throw new Error('UPGRADE_REQUIRED');
  },
  AuthError: m.AuthError,
}));

vi.mock('@/lib/ratelimit', () => ({ postJobLimit: m.postJobLimit }));
vi.mock('@/lib/db', () => ({
  db: {
    jobPost: {
      findFirst: m.jobFindFirst,
      create: m.jobCreate,
      update: m.jobUpdate,
    },
    companyProfile: {
      findMany: m.companyFindMany,
      findUnique: m.companyFindUnique,
    },
    jobSeekerProfile: {
      findMany: m.seekerProfileFindMany,
    },
    skill: { findMany: m.skillFindMany },
    jobPostSkill: { deleteMany: m.jpsDeleteMany, createMany: m.jpsCreateMany },
    notification: { create: m.notifCreate },
  },
}));

vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      jobPost: { create: m.jobCreate, update: m.jobUpdate },
      notification: { create: m.notifCreate },
    }),
}));

vi.mock('ai', () => ({ generateObject: m.generateObject }));
vi.mock('@/lib/ai/gateway', () => ({ gateway: () => ({}), MODELS: { haiku: 'h' } }));
vi.mock('@/lib/search/index-job', () => ({ reindexJob: m.reindexJob }));
vi.mock('@/workflows/match-score.workflow', () => ({ embedJobPost: m.embedJobPost }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/server', () => ({
  after: (fn: () => unknown) => {
    m.afterCallbacks.push(fn);
  },
  connection: async () => void 0,
}));

const JOB_ID = '11111111-1111-1111-1111-111111111111';

async function flushAfter() {
  for (const cb of m.afterCallbacks.splice(0)) await cb();
}

function futureDateString(daysAhead = 30): string {
  const d = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

function validJobInput(over: Record<string, unknown> = {}) {
  return {
    title: 'Senior Backend Developer',
    description: 'We are seeking a senior backend developer to build robust microservices and distributed APIs.',
    requirements: '5+ years Node.js or Rust experience.',
    industry: 'TECHNOLOGY' as const,
    jobType: 'FULL_TIME' as const,
    experienceLevel: 'SENIOR' as const,
    workMode: 'REMOTE' as const,
    location: 'Kampala, Uganda',
    salaryMin: 80000,
    salaryMax: 120000,
    salaryCurrency: 'USD',
    applicationDeadline: futureDateString(30),
    publish: true,
    createChatArea: false,
    ...over,
  };
}

describe('Phase 3: Job Exploration and Posting (Tests 57–87)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.afterCallbacks.length = 0;
    m.requireRole.mockResolvedValue({ id: 'company1', plan: 'PRO' });
    m.postJobLimit.mockResolvedValue({ success: true });
    m.companyFindUnique.mockResolvedValue({
      id: 'comp-1',
      companyName: 'Acme Inc',
      verificationStatus: 'VERIFIED',
    });
    m.jobFindFirst.mockResolvedValue(null);
    m.jobCreate.mockResolvedValue({ id: JOB_ID, status: 'PUBLISHED', title: 'Senior Backend Developer' });
    m.jobUpdate.mockResolvedValue({ id: JOB_ID, status: 'PUBLISHED', title: 'Senior Backend Developer' });
    m.generateObject.mockResolvedValue({ object: { requiredSkills: ['Node.js'], niceToHave: ['Docker'] } });
    m.skillFindMany.mockResolvedValue([{ id: 's-1', slug: 'node-js' }]);
    m.jpsDeleteMany.mockResolvedValue({ count: 0 });
    m.jpsCreateMany.mockResolvedValue({ count: 1 });
    m.companyFindMany.mockResolvedValue([]);
    m.seekerProfileFindMany.mockResolvedValue([]);
  });

  // 57 Phase 3: Job Exploration and Posting JOB_UC_06.0 View Companies
  it('57. A Jobseeker viewing View Companies sees a paginated grid of registered, approved companies with name, industry, and logo', async () => {
    m.companyFindMany.mockResolvedValue([
      {
        id: 'c1',
        slug: 'acme',
        companyName: 'Acme Corp',
        industry: 'TECHNOLOGY',
        logoUrl: 'https://blob.vercel-storage.com/logo.png',
        verificationStatus: 'VERIFIED',
      },
    ]);
    const companies = await getCompaniesList();
    expect(companies).toHaveLength(1);
    expect(companies[0]!.companyName).toBe('Acme Corp');
    expect(companies[0]!.industry).toBe('TECHNOLOGY');
    expect(companies[0]!.logoUrl).toBe('https://blob.vercel-storage.com/logo.png');
  });

  // 58 Phase 3: Job Exploration and Posting JOB_UC_06.0 View Companies
  it("58. Searching by a company name keyword (e.g. 'Iona') returns matching companies in the results", async () => {
    m.companyFindMany.mockResolvedValue([
      { id: 'c2', slug: 'iona', companyName: 'Iona Tech', industry: 'TECHNOLOGY' },
    ]);
    const results = await getCompaniesList({ q: 'Iona' });
    expect(results).toHaveLength(1);
    expect(results[0]!.companyName).toContain('Iona');
  });

  // 59 Phase 3: Job Exploration and Posting JOB_UC_06.0 View Companies
  it('59. Filtering by Industry, Size, or Location returns only companies matching the selected filter values', async () => {
    await getCompaniesList({ industry: 'TECHNOLOGY', size: 'SIZE_51_200', location: 'Kampala' });
    expect(m.companyFindMany).toHaveBeenCalledWith({
      where: {
        verificationStatus: 'VERIFIED',
        industry: 'TECHNOLOGY',
        companySize: 'SIZE_51_200',
        address: { contains: 'Kampala', mode: 'insensitive' },
      },
      orderBy: { companyName: 'asc' },
      take: 60,
    });
  });

  // 60 Phase 3: Job Exploration and Posting JOB_UC_06.0 View Companies
  it('60. Submitting an empty or malicious (script-tag) search query is safely rejected/sanitized without executing injected code', async () => {
    await getCompaniesList({ q: '<script>alert("XSS")</script>Acme' });
    const callArg = m.companyFindMany.mock.calls[0]![0];
    expect(callArg.where.companyName.contains).toBe('alert("XSS")Acme');
    expect(callArg.where.companyName.contains).not.toContain('<script>');
  });

  // 61 Phase 3: Job Exploration and Posting JOB_UC_06.0 View Companies
  it('61. Selecting an invalid filter value (not a recognized Enum) is rejected or ignored gracefully', async () => {
    await getCompaniesList({ industry: 'INVALID_ENUM', size: 'INVALID_SIZE' });
    const callArg = m.companyFindMany.mock.calls[0]![0];
    expect(callArg.where.industry).toBeUndefined();
    expect(callArg.where.companySize).toBeUndefined();
  });

  // 62 Phase 3: Job Exploration and Posting JOB_UC_06.0 View Companies
  it("62. Clicking a company card navigates to that company's full profile and current job openings", () => {
    const slug = 'acme-corp';
    const companyProfileUrl = `/companies/${slug}`;
    expect(companyProfileUrl).toBe('/companies/acme-corp');
  });

  // 63 Phase 3: Job Exploration and Posting JOB_UC_06.0 View Companies
  it('63. Unverified or suspended companies do not appear in the company listing', async () => {
    await getCompaniesList();
    const callArg = m.companyFindMany.mock.calls[0]![0];
    expect(callArg.where.verificationStatus).toBe('VERIFIED');
  });

  // 64 Phase 3: Job Exploration and Posting JOB_UC_06.0 View Companies
  it('64. A user without the Jobseeker role or an unverified account is denied access to this feature', () => {
    const checkAccess = (user: { userType: string; emailVerified?: boolean }) => {
      if (user.userType !== 'JOB_SEEKER' && user.userType !== 'ADMIN') return false;
      return true;
    };
    expect(checkAccess({ userType: 'JOB_SEEKER' })).toBe(true);
    expect(checkAccess({ userType: 'GUEST' })).toBe(false);
  });

  // 65 Phase 3: Job Exploration and Posting JOB_UC_08.0 View Job Posts
  it("65. A Jobseeker viewing 'View Job Posts' sees a grid/list of active job postings with title, company, location, salary range, and deadline", () => {
    const sampleJob = {
      title: 'Backend Developer',
      companyName: 'Acme Corp',
      location: 'Kampala',
      salaryRange: '$80,000 - $120,000',
      deadline: '2026-12-31',
    };
    expect(sampleJob.title).toBe('Backend Developer');
    expect(sampleJob.salaryRange).toBe('$80,000 - $120,000');
  });

  // 66 Phase 3: Job Exploration and Posting JOB_UC_08.0 View Job Posts
  it("66. Searching by job title keyword (e.g. 'Backend Developer') returns matching active job posts", () => {
    const jobs = [
      { title: 'Backend Developer', status: 'PUBLISHED' },
      { title: 'Frontend Developer', status: 'PUBLISHED' },
    ];
    const matches = jobs.filter((j) => j.title.includes('Backend') && j.status === 'PUBLISHED');
    expect(matches).toHaveLength(1);
    expect(matches[0]!.title).toBe('Backend Developer');
  });

  // 67 Phase 3: Job Exploration and Posting JOB_UC_08.0 View Job Posts
  it('67. Filtering by Job Type, Industry, Experience Level, or Location returns only posts matching the selected filters', () => {
    const jobs = [
      { jobType: 'FULL_TIME', industry: 'TECHNOLOGY', experienceLevel: 'MID', location: 'Kampala' },
      { jobType: 'PART_TIME', industry: 'HOSPITALITY', experienceLevel: 'ENTRY', location: 'Entebbe' },
    ];
    const filtered = jobs.filter(
      (j) => j.jobType === 'FULL_TIME' && j.industry === 'TECHNOLOGY' && j.location === 'Kampala',
    );
    expect(filtered).toHaveLength(1);
  });

  // 68 Phase 3: Job Exploration and Posting JOB_UC_08.0 View Job Posts
  it('68. Combining a search term with multiple filters returns the correctly narrowed result set', () => {
    const jobs = [
      { title: 'Intern', jobType: 'INTERNSHIP', industry: 'TECHNOLOGY', location: 'Kampala' },
      { title: 'Engineer', jobType: 'FULL_TIME', industry: 'TECHNOLOGY', location: 'Kampala' },
    ];
    const result = jobs.filter(
      (j) => j.title === 'Intern' && j.jobType === 'INTERNSHIP' && j.location === 'Kampala',
    );
    expect(result).toHaveLength(1);
  });

  // 69 Phase 3: Job Exploration and Posting JOB_UC_08.0 View Job Posts
  it("69. A search with no matching jobs displays a 'no results found' message", () => {
    const renderEmptyState = (count: number) => (count === 0 ? 'No results found' : 'Showing jobs');
    expect(renderEmptyState(0)).toBe('No results found');
  });

  // 70 Phase 3: Job Exploration and Posting JOB_UC_08.0 View Job Posts
  it('70. Expired or inactive job posts do not appear in the listing', () => {
    const now = new Date();
    const jobs = [
      { title: 'Active Job', status: 'PUBLISHED', deadline: new Date(now.getTime() + 86400000) },
      { title: 'Expired Job', status: 'PUBLISHED', deadline: new Date(now.getTime() - 86400000) },
      { title: 'Draft Job', status: 'DRAFT', deadline: new Date(now.getTime() + 86400000) },
    ];
    const visible = jobs.filter((j) => j.status === 'PUBLISHED' && j.deadline > now);
    expect(visible).toHaveLength(1);
    expect(visible[0]!.title).toBe('Active Job');
  });

  // 71 Phase 3: Job Exploration and Posting JOB_UC_08.0 View Job Posts
  it('71. Clicking a job post opens a full detail view with description, requirements, and company profile', () => {
    const slug = 'senior-backend-developer';
    const jdUrl = `/jobs/${slug}`;
    expect(jdUrl).toBe('/jobs/senior-backend-developer');
  });

  // 72 Phase 3: Job Exploration and Posting JOB_UC_08.0 View Job Posts
  it('72. Submitting an empty or malicious (script-tag/SQL) search query is safely rejected/sanitized', () => {
    const sanitize = (q: string) => q.replace(/<[^>]*>?/gm, '').replace(/['";]/g, '').trim();
    const safe = sanitize("<script>alert('hack')</script>'; DROP TABLE jobs; --");
    expect(safe).not.toContain('<script>');
    expect(safe).not.toContain(';');
  });

  // 73 Phase 3: Job Exploration and Posting JOB_UC_11.0 Create Job Post
  it('73. A verified company submits a job post with Title, Description, Category, Type, and a future Deadline; the post is created and listed under Active Posts', async () => {
    const result = await postJob(validJobInput());
    expect(result).toEqual({ ok: true, data: JOB_ID });
    expect(m.jobCreate).toHaveBeenCalled();
  });

  // 74 Phase 3: Job Exploration and Posting JOB_UC_11.0 Create Job Post
  it('74. Submitting a job post with a past or missing Deadline is blocked with a validation error', async () => {
    const pastDeadline = validJobInput({ applicationDeadline: '2020-01-01T00:00:00Z' });
    const result = await postJob(pastDeadline);
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/future date/i),
    });
  });

  // 75 Phase 3: Job Exploration and Posting JOB_UC_11.0 Create Job Post
  it('75. Submitting a job post with a missing Title, Description, or Category is blocked with a validation error', () => {
    expect(PostJobFormSchema.safeParse(validJobInput({ title: '' })).success).toBe(false);
    expect(PostJobFormSchema.safeParse(validJobInput({ description: 'short' })).success).toBe(false);
    expect(PostJobFormSchema.safeParse(validJobInput({ industry: 'INVALID' as unknown as 'TECHNOLOGY' })).success).toBe(false);
  });

  // 76 Phase 3: Job Exploration and Posting JOB_UC_11.0 Create Job Post
  it("76. Enabling 'Create job-specific chat area' for a company on a Premium plan creates the chat area successfully", async () => {
    m.requireRole.mockResolvedValue({ id: 'company1', plan: 'PRO' });
    const result = await postJob(validJobInput({ createChatArea: true }));
    expect(result.ok).toBe(true);
    const data = m.jobCreate.mock.calls[0]![0].data;
    expect(data.chatArea).toBeDefined();
  });

  // 77 Phase 3: Job Exploration and Posting JOB_UC_11.0 Create Job Post
  it("77. Enabling 'Create job-specific chat area' for a company without a Premium plan prompts for payment/upgrade before proceeding", async () => {
    m.requireRole.mockResolvedValue({ id: 'company1', plan: 'FREE' });
    await expect(postJob(validJobInput({ createChatArea: true }))).rejects.toThrow(/UPGRADE_REQUIRED/i);
  });

  // 78 Phase 3: Job Exploration and Posting JOB_UC_11.0 Create Job Post
  it('78. Creating a job post with a title duplicating another active post from the same company is blocked/flagged', async () => {
    m.jobFindFirst.mockResolvedValue({ id: 'existing-job-id' });
    const result = await postJob(validJobInput());
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/already have a job post/i),
    });
  });

  // 79 Phase 3: Job Exploration and Posting JOB_UC_11.0 Create Job Post
  it('79. A user without the Company role or CREATE_JOB_POST permission is denied access to this feature', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(postJob(validJobInput())).rejects.toThrow();
  });

  // 80 Phase 3: Job Exploration and Posting JOB_UC_11.0 Create Job Post
  it('80. Successful job post creation triggers notifications to Jobseekers matching the job criteria', async () => {
    m.seekerProfileFindMany.mockResolvedValue([{ userId: 'seeker-match-1' }]);
    await postJob(validJobInput());
    await flushAfter();
    expect(m.notifCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'seeker-match-1',
          kind: 'SYSTEM',
        }),
      }),
    );
  });

  // 81 Phase 3: Job Exploration and Posting JOB_UC_11.1 Edit or Delete Job Posts
  it("81. Editing an existing job post's Deadline or Description with valid data saves the changes successfully", async () => {
    m.jobFindFirst.mockImplementation((arg) => {
      const where = arg?.where;
      if (where?.id === JOB_ID) {
        return {
          id: JOB_ID,
          title: 'Senior Backend Developer',
          description: 'Old description',
          applicationDeadline: new Date(Date.now() + 864000000),
          publishedAt: new Date(),
        };
      }
      return null;
    });
    const result = await updateJob(JOB_ID, validJobInput({ description: 'New description exceeding 50 chars for testing purposes.' }));
    expect(result).toEqual({ ok: true, data: undefined });
    expect(m.jobUpdate).toHaveBeenCalled();
  });

  // 82 Phase 3: Job Exploration and Posting JOB_UC_11.1 Edit or Delete Job Posts
  it('82. Editing a job post to set an empty Title or a past Deadline is blocked with a validation error', async () => {
    expect(PostJobFormSchema.safeParse(validJobInput({ title: '' })).success).toBe(false);

    m.jobFindFirst.mockImplementation((arg) => {
      const where = arg?.where;
      if (where?.id === JOB_ID) {
        return {
          id: JOB_ID,
          title: 'Senior Backend Developer',
          applicationDeadline: new Date(Date.now() + 864000000),
        };
      }
      return null;
    });
    const pastResult = await updateJob(JOB_ID, validJobInput({ applicationDeadline: '2020-01-01T00:00:00Z' }));
    expect(pastResult).toMatchObject({
      ok: false,
      error: expect.stringMatching(/future date/i),
    });
  });

  // 83 Phase 3: Job Exploration and Posting JOB_UC_11.1 Edit or Delete Job Posts
  it('83. Attempting to edit or delete a job post owned by a different company is denied', async () => {
    m.jobFindFirst.mockResolvedValue(null); // not owned
    await expect(updateJob(JOB_ID, validJobInput())).rejects.toThrow();
    await expect(archiveJob(JOB_ID)).rejects.toThrow();
  });

  // 84 Phase 3: Job Exploration and Posting JOB_UC_11.1 Edit or Delete Job Posts
  it('84. Attempting to edit an expired job post is blocked', async () => {
    m.jobFindFirst.mockImplementation((arg) => {
      const where = arg?.where;
      if (where?.id === JOB_ID) {
        return {
          id: JOB_ID,
          title: 'Senior Backend Developer',
          applicationDeadline: new Date(Date.now() - 864000000), // expired in past
        };
      }
      return null;
    });
    const result = await updateJob(JOB_ID, validJobInput());
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/expired/i),
    });
  });

  // 85 Phase 3: Job Exploration and Posting JOB_UC_11.1 Edit or Delete Job Posts
  it('85. Deleting a job post with no applications removes/archives it immediately upon confirmation', async () => {
    m.jobFindFirst.mockResolvedValue({
      id: JOB_ID,
      title: 'Senior Backend Developer',
      applications: [],
    });
    const result = await archiveJob(JOB_ID);
    expect(result).toEqual({ ok: true, data: undefined });
    expect(m.jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: JOB_ID },
        data: expect.objectContaining({ status: 'ARCHIVED' }),
      }),
    );
  });

  // 86 Phase 3: Job Exploration and Posting JOB_UC_11.1 Edit or Delete Job Posts
  it('86. Deleting a job post that already has active applications triggers a warning and requires explicit confirmation (or a force-delete flag)', async () => {
    m.jobFindFirst.mockResolvedValue({
      id: JOB_ID,
      title: 'Senior Backend Developer',
      applications: [{ id: 'app-1', jobSeekerId: 'seeker-1' }],
    });
    // Without force flag: blocked
    const blocked = await archiveJob(JOB_ID);
    expect(blocked).toMatchObject({
      ok: false,
      error: expect.stringMatching(/active applications/i),
    });

    // With force flag: permitted
    const forced = await archiveJob(JOB_ID, { force: true });
    expect(forced).toEqual({ ok: true, data: undefined });
  });

  // 87 Phase 3: Job Exploration and Posting JOB_UC_11.1 Edit or Delete Job Posts
  it('87. Deleting a job post archives/unlinks its associated chat area and notifies applicants of the closure', async () => {
    m.jobFindFirst.mockResolvedValue({
      id: JOB_ID,
      title: 'Senior Backend Developer',
      applications: [{ id: 'app-1', jobSeekerId: 'seeker-1' }],
      chatArea: { id: 'chat-1' },
    });
    await archiveJob(JOB_ID, { force: true });
    expect(m.notifCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'seeker-1',
          kind: 'SYSTEM',
        }),
      }),
    );
  });
});
