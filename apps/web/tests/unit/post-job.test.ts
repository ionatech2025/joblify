import { vi, describe, it, expect, beforeEach } from 'vitest';
import type * as AuthModule from '@/lib/auth';

// Money path (supply side): company posts/edits a job — auth → zod → audit'd
// write → best-effort AI skill extraction + Algolia index → cache invalidation.

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
    requireRole: vi.fn(),
    postJobLimit: vi.fn(),
    jobCreate: vi.fn(),
    jobUpdate: vi.fn(),
    jobFindFirst: vi.fn(),
    skillFindMany: vi.fn(),
    jpsDeleteMany: vi.fn(),
    jpsCreateMany: vi.fn(),
    generateObject: vi.fn(),
    reindexJob: vi.fn(),
    embedJobPost: vi.fn(),
    updateTag: vi.fn(),
    captureException: vi.fn(),
    // Fluid Compute drops floating promises at response-send: every background
    // side effect must be registered through next/server's after(). The mock
    // captures the callbacks so tests can assert registration and run them
    // deliberately (runAfterCallbacks below).
    afterCallbacks,
    after: vi.fn((fn: () => unknown) => {
      afterCallbacks.push(fn);
    }),
  };
});

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return { ...actual, requireRole: m.requireRole, AuthError: m.AuthError };
});
vi.mock('@/lib/ratelimit', () => ({ postJobLimit: m.postJobLimit }));
vi.mock('@/lib/db', () => ({
  db: {
    jobPost: { findFirst: m.jobFindFirst },
    skill: { findMany: m.skillFindMany },
    jobPostSkill: { deleteMany: m.jpsDeleteMany, createMany: m.jpsCreateMany },
  },
}));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({ jobPost: { create: m.jobCreate, update: m.jobUpdate } }),
}));
vi.mock('ai', () => ({ generateObject: m.generateObject }));
vi.mock('@/lib/ai/gateway', () => ({ gateway: () => ({}), MODELS: { haiku: 'h' } }));
vi.mock('@/lib/search/index-job', () => ({ reindexJob: m.reindexJob }));
vi.mock('@/workflows/match-score.workflow', () => ({ embedJobPost: m.embedJobPost }));
vi.mock('@sentry/nextjs', () => ({ captureException: m.captureException }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/server', () => ({ after: m.after }));

import { postJob, updateJob, archiveJob } from '@/app/actions/post-job';

const JOB_ID = '11111111-1111-1111-1111-111111111111';

// Run the callbacks the action registered via after() — i.e. what Next would
// execute once the response has been sent.
async function runAfterCallbacks(): Promise<void> {
  for (const cb of m.afterCallbacks.splice(0)) await cb();
}

function input(over: Record<string, unknown> = {}) {
  return {
    title: 'Senior Rust Engineer',
    description: 'Build fast, reliable distributed systems in Rust. Own services end to end.',
    requirements: '',
    industry: 'TECHNOLOGY',
    jobType: 'FULL_TIME',
    experienceLevel: 'SENIOR',
    workMode: 'REMOTE',
    location: 'Remote (EU)',
    salaryMin: 100000,
    salaryMax: 140000,
    salaryCurrency: 'EUR',
    applicationDeadline: '',
    publish: true,
    ...over,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zod parses at runtime
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  m.afterCallbacks.length = 0;
  m.after.mockImplementation((fn: () => unknown) => {
    m.afterCallbacks.push(fn);
  });
  m.embedJobPost.mockResolvedValue([0.1, 0.2]);
  m.requireRole.mockResolvedValue({ id: 'company1', plan: 'PRO' });
  m.postJobLimit.mockResolvedValue({ success: true });
  m.jobFindFirst.mockResolvedValue(null); // no duplicate title by default
  m.jobCreate.mockResolvedValue({ id: JOB_ID, status: 'PUBLISHED', title: 'Senior Rust Engineer' });
  m.jobUpdate.mockResolvedValue({ id: JOB_ID, status: 'PUBLISHED', title: 'Senior Rust Engineer' });
  m.generateObject.mockResolvedValue({
    object: { requiredSkills: ['Rust'], niceToHave: ['Docker'] },
  });
  m.skillFindMany.mockResolvedValue([
    { id: 's-rust', slug: 'rust' },
    { id: 's-docker', slug: 'docker' },
  ]);
  m.jpsDeleteMany.mockResolvedValue({ count: 0 });
  m.jpsCreateMany.mockResolvedValue({ count: 2 });
  m.reindexJob.mockResolvedValue(undefined);
});

describe('postJob', () => {
  it('propagates the auth error for non-companies and writes nothing', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(postJob(input())).rejects.toThrow();
    expect(m.jobCreate).not.toHaveBeenCalled();
  });

  it('rejects invalid input (short description) before writing', async () => {
    await expect(postJob(input({ description: 'too short' }))).rejects.toThrow();
    expect(m.jobCreate).not.toHaveBeenCalled();
  });

  it('enforces the daily posting rate limit', async () => {
    m.postJobLimit.mockResolvedValue({ success: false });
    await expect(postJob(input())).rejects.toThrow(/limit/i);
    expect(m.jobCreate).not.toHaveBeenCalled();
  });

  it("rejects a duplicate title among the company's other live posts", async () => {
    m.jobFindFirst.mockResolvedValue({ id: 'other-job' });
    await expect(postJob(input())).rejects.toThrow(/already have a job post/i);
    expect(m.jobCreate).not.toHaveBeenCalled();
  });

  it('publishes with ownership, slug, and publishedAt on the happy path', async () => {
    const id = await postJob(input());
    expect(id).toBe(JOB_ID);
    const data = m.jobCreate.mock.calls[0]![0].data;
    expect(data.companyId).toBe('company1');
    expect(data.status).toBe('PUBLISHED');
    expect(data.publishedAt).toBeInstanceOf(Date);
    expect(data.slug).toMatch(/^senior-rust-engineer-[a-z0-9]{6}$/);
  });

  it('saves a draft without publishedAt when publish=false', async () => {
    await postJob(input({ publish: false }));
    const data = m.jobCreate.mock.calls[0]![0].data;
    expect(data.status).toBe('DRAFT');
    expect(data.publishedAt).toBeNull();
  });

  it('links extracted skills with required=2 / nice-to-have=1 weights', async () => {
    await postJob(input());
    await runAfterCallbacks();
    expect(m.jpsCreateMany).toHaveBeenCalledTimes(1);
    // re-extraction is idempotent: old links cleared first
    expect(m.jpsDeleteMany).toHaveBeenCalledWith({ where: { jobPostId: JOB_ID } });
    const rows = m.jpsCreateMany.mock.calls[0]![0].data;
    expect(rows).toContainEqual({ jobPostId: JOB_ID, skillId: 's-rust', weight: 2 });
    expect(rows).toContainEqual({ jobPostId: JOB_ID, skillId: 's-docker', weight: 1 });
  });

  it('pushes the job to the search index and invalidates caches', async () => {
    await postJob(input());
    await runAfterCallbacks();
    expect(m.reindexJob).toHaveBeenCalledWith(JOB_ID);
    expect(m.updateTag).toHaveBeenCalledWith('jobs');
    expect(m.updateTag).toHaveBeenCalledWith('company:company1');
  });

  it('schedules all background work via after() instead of floating promises (issue #43)', async () => {
    await postJob(input());
    // Registered but NOT yet executed at response time…
    expect(m.after).toHaveBeenCalledTimes(1);
    expect(m.generateObject).not.toHaveBeenCalled();
    expect(m.reindexJob).not.toHaveBeenCalled();
    expect(m.embedJobPost).not.toHaveBeenCalled();
    // …and running the registered callbacks performs the work.
    await runAfterCallbacks();
    expect(m.generateObject).toHaveBeenCalledTimes(1);
    expect(m.reindexJob).toHaveBeenCalledWith(JOB_ID);
    expect(m.embedJobPost).toHaveBeenCalledWith(JOB_ID);
  });

  it('embeds the JD on publish so never-applied jobs surface in matches (issue #41)', async () => {
    await postJob(input({ publish: true }));
    await runAfterCallbacks();
    expect(m.embedJobPost).toHaveBeenCalledWith(JOB_ID);
  });

  it('does not embed drafts', async () => {
    m.jobCreate.mockResolvedValue({ id: JOB_ID, status: 'DRAFT', title: 'Senior Rust Engineer' });
    await postJob(input({ publish: false }));
    await runAfterCallbacks();
    expect(m.embedJobPost).not.toHaveBeenCalled();
  });

  it('still saves the job when AI skill extraction fails (best-effort), reporting to Sentry', async () => {
    m.generateObject.mockRejectedValue(new Error('gateway down'));
    await expect(postJob(input())).resolves.toBe(JOB_ID);
    expect(m.jobCreate).toHaveBeenCalledTimes(1);
    await runAfterCallbacks(); // the failing extraction must not throw out of after()
    expect(m.captureException).toHaveBeenCalledWith(expect.any(Error), { tags: { jobId: JOB_ID } });
    // …and the later steps still ran.
    expect(m.reindexJob).toHaveBeenCalledWith(JOB_ID);
  });

  it('still saves the job when the Algolia push fails (best-effort)', async () => {
    m.reindexJob.mockRejectedValue(new Error('algolia down'));
    await expect(postJob(input())).resolves.toBe(JOB_ID);
    await runAfterCallbacks();
    expect(m.captureException).toHaveBeenCalledWith(expect.any(Error), { tags: { jobId: JOB_ID } });
  });

  it('attaches a company-joined chat area when createChatArea is set (JOB_UC_11)', async () => {
    await postJob(input({ createChatArea: true }));
    const area = m.jobCreate.mock.calls[0]![0].data.chatArea;
    expect(area.create.kind).toBe('JOB');
    expect(area.create.companyId).toBe('company1');
    expect(area.create.participants.create).toEqual({ userId: 'company1' });
  });

  it('requires a Pro plan to create a job-specific chat area', async () => {
    m.requireRole.mockResolvedValue({ id: 'company1', plan: 'FREE' });
    await expect(postJob(input({ createChatArea: true }))).rejects.toThrow('UPGRADE_REQUIRED');
    expect(m.jobCreate).not.toHaveBeenCalled();
  });

  it('creates no chat area by default', async () => {
    await postJob(input());
    expect(m.jobCreate.mock.calls[0]![0].data.chatArea).toBeUndefined();
  });
});

describe('updateJob', () => {
  it("rejects editing another company's job (tenancy)", async () => {
    m.jobFindFirst.mockResolvedValue(null);
    await expect(updateJob(JOB_ID, input())).rejects.toThrow();
    expect(m.jobUpdate).not.toHaveBeenCalled();
  });

  it('keeps the original publishedAt on re-saves of a published job', async () => {
    const first = new Date('2026-01-01T00:00:00Z');
    // Calls in order: tenancy check, then the title-uniqueness check (no dup).
    m.jobFindFirst
      .mockResolvedValueOnce({ id: JOB_ID, publishedAt: first })
      .mockResolvedValueOnce(null);
    await updateJob(JOB_ID, input({ publish: true }));
    expect(m.jobUpdate.mock.calls[0]![0].data.publishedAt).toBe(first);
  });

  it('stamps publishedAt on first publish of a draft', async () => {
    m.jobFindFirst
      .mockResolvedValueOnce({ id: JOB_ID, publishedAt: null })
      .mockResolvedValueOnce(null);
    await updateJob(JOB_ID, input({ publish: true }));
    expect(m.jobUpdate.mock.calls[0]![0].data.publishedAt).toBeInstanceOf(Date);
  });

  it('reindexes and invalidates the JD, list, and company caches', async () => {
    m.jobFindFirst
      .mockResolvedValueOnce({ id: JOB_ID, publishedAt: new Date() })
      .mockResolvedValueOnce(null);
    await updateJob(JOB_ID, input());
    await runAfterCallbacks();
    expect(m.reindexJob).toHaveBeenCalledWith(JOB_ID);
    expect(m.updateTag).toHaveBeenCalledWith(`job:${JOB_ID}`);
    expect(m.updateTag).toHaveBeenCalledWith('jobs');
    expect(m.updateTag).toHaveBeenCalledWith('company:company1');
  });

  it('schedules background work via after() and force-refreshes the embedding when the JD text changed', async () => {
    m.jobFindFirst
      .mockResolvedValueOnce({
        id: JOB_ID,
        publishedAt: new Date(),
        title: 'Senior Rust Engineer',
        description: 'An older description that the edit replaces.',
        requirements: null,
      })
      .mockResolvedValueOnce(null);
    await updateJob(JOB_ID, input({ publish: true }));
    expect(m.after).toHaveBeenCalledTimes(1);
    expect(m.embedJobPost).not.toHaveBeenCalled();
    await runAfterCallbacks();
    expect(m.embedJobPost).toHaveBeenCalledWith(JOB_ID, { force: true });
  });

  it('keeps the existing embedding when the JD text is unchanged (idempotent re-save)', async () => {
    const unchanged = input();
    m.jobFindFirst
      .mockResolvedValueOnce({
        id: JOB_ID,
        publishedAt: new Date(),
        title: unchanged.title,
        description: unchanged.description,
        requirements: null, // form sends '' which normalizes to null
      })
      .mockResolvedValueOnce(null);
    await updateJob(JOB_ID, unchanged);
    await runAfterCallbacks();
    expect(m.embedJobPost).toHaveBeenCalledWith(JOB_ID, { force: false });
  });

  it('does not embed when the edit lands as a draft', async () => {
    m.jobFindFirst
      .mockResolvedValueOnce({ id: JOB_ID, publishedAt: null })
      .mockResolvedValueOnce(null);
    m.jobUpdate.mockResolvedValue({ id: JOB_ID, status: 'DRAFT', title: 'Senior Rust Engineer' });
    await updateJob(JOB_ID, input({ publish: false }));
    await runAfterCallbacks();
    expect(m.embedJobPost).not.toHaveBeenCalled();
    expect(m.reindexJob).toHaveBeenCalledWith(JOB_ID); // deindexes the draft
  });

  it("rejects a duplicate title among the company's other live posts", async () => {
    m.jobFindFirst
      .mockResolvedValueOnce({ id: JOB_ID, publishedAt: new Date() })
      .mockResolvedValueOnce({ id: 'other-job' });
    await expect(updateJob(JOB_ID, input())).rejects.toThrow('already have a job post');
    expect(m.jobUpdate).not.toHaveBeenCalled();
  });

  it('creates a chat area when the box is toggled on and none exists', async () => {
    m.jobFindFirst
      .mockResolvedValueOnce({ id: JOB_ID, publishedAt: new Date(), chatArea: null })
      .mockResolvedValueOnce(null);
    await updateJob(JOB_ID, input({ createChatArea: true }));
    expect(m.jobUpdate.mock.calls[0]![0].data.chatArea.create.kind).toBe('JOB');
  });

  it('requires a Pro plan to create a chat area that does not yet exist', async () => {
    m.requireRole.mockResolvedValue({ id: 'company1', plan: 'FREE' });
    m.jobFindFirst.mockResolvedValueOnce({ id: JOB_ID, publishedAt: new Date(), chatArea: null });
    await expect(updateJob(JOB_ID, input({ createChatArea: true }))).rejects.toThrow(
      'UPGRADE_REQUIRED',
    );
    expect(m.jobUpdate).not.toHaveBeenCalled();
  });

  it('never recreates an existing chat area', async () => {
    m.jobFindFirst
      .mockResolvedValueOnce({
        id: JOB_ID,
        publishedAt: new Date(),
        chatArea: { id: 'area1' },
      })
      .mockResolvedValueOnce(null);
    await updateJob(JOB_ID, input({ createChatArea: true }));
    expect(m.jobUpdate.mock.calls[0]![0].data.chatArea).toBeUndefined();
  });

  it('does not require Pro when the box is toggled on but an area already exists', async () => {
    // Not actually creating anything new — should succeed even on FREE.
    m.requireRole.mockResolvedValue({ id: 'company1', plan: 'FREE' });
    m.jobFindFirst
      .mockResolvedValueOnce({ id: JOB_ID, publishedAt: new Date(), chatArea: { id: 'area1' } })
      .mockResolvedValueOnce(null);
    await expect(updateJob(JOB_ID, input({ createChatArea: true }))).resolves.toBeUndefined();
  });
});

describe('archiveJob', () => {
  it("rejects archiving another company's job (tenancy)", async () => {
    m.jobFindFirst.mockResolvedValue(null);
    await expect(archiveJob(JOB_ID)).rejects.toThrow();
    expect(m.jobUpdate).not.toHaveBeenCalled();
  });

  it('soft-deletes and marks the job ARCHIVED on the happy path', async () => {
    m.jobFindFirst.mockResolvedValue({ id: JOB_ID });
    await archiveJob(JOB_ID);
    const data = m.jobUpdate.mock.calls[0]![0].data;
    expect(data.status).toBe('ARCHIVED');
    expect(data.deletedAt).toBeInstanceOf(Date);
  });

  it('de-indexes from Algolia via after(), never a floating promise', async () => {
    m.jobFindFirst.mockResolvedValue({ id: JOB_ID });
    await archiveJob(JOB_ID);
    expect(m.after).toHaveBeenCalledTimes(1);
    expect(m.reindexJob).not.toHaveBeenCalled();
    await runAfterCallbacks();
    expect(m.reindexJob).toHaveBeenCalledWith(JOB_ID);
    expect(m.embedJobPost).not.toHaveBeenCalled();
  });
});
