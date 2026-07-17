import { vi, describe, it, expect, beforeEach } from 'vitest';

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
    updateTag: vi.fn(),
  };
});

vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole, AuthError: m.AuthError }));
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
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));

import { postJob, updateJob, archiveJob } from '@/app/actions/post-job';

const JOB_ID = '11111111-1111-1111-1111-111111111111';

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
  m.requireRole.mockResolvedValue({ id: 'company1' });
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
    await vi.waitFor(() => expect(m.jpsCreateMany).toHaveBeenCalledTimes(1));
    // re-extraction is idempotent: old links cleared first
    expect(m.jpsDeleteMany).toHaveBeenCalledWith({ where: { jobPostId: JOB_ID } });
    const rows = m.jpsCreateMany.mock.calls[0]![0].data;
    expect(rows).toContainEqual({ jobPostId: JOB_ID, skillId: 's-rust', weight: 2 });
    expect(rows).toContainEqual({ jobPostId: JOB_ID, skillId: 's-docker', weight: 1 });
  });

  it('pushes the job to the search index and invalidates caches', async () => {
    await postJob(input());
    await vi.waitFor(() => expect(m.reindexJob).toHaveBeenCalledWith(JOB_ID));
    expect(m.updateTag).toHaveBeenCalledWith('jobs');
    expect(m.updateTag).toHaveBeenCalledWith('company:company1');
  });

  it('still saves the job when AI skill extraction fails (best-effort)', async () => {
    m.generateObject.mockRejectedValue(new Error('gateway down'));
    await expect(postJob(input())).resolves.toBe(JOB_ID);
    expect(m.jobCreate).toHaveBeenCalledTimes(1);
  });

  it('still saves the job when the Algolia push fails (best-effort)', async () => {
    m.reindexJob.mockRejectedValue(new Error('algolia down'));
    await expect(postJob(input())).resolves.toBe(JOB_ID);
  });

  it('attaches a company-joined chat area when createChatArea is set (JOB_UC_11)', async () => {
    await postJob(input({ createChatArea: true }));
    const area = m.jobCreate.mock.calls[0]![0].data.chatArea;
    expect(area.create.kind).toBe('JOB');
    expect(area.create.companyId).toBe('company1');
    expect(area.create.participants.create).toEqual({ userId: 'company1' });
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
    m.jobFindFirst.mockResolvedValueOnce({ id: JOB_ID, publishedAt: first }).mockResolvedValueOnce(null);
    await updateJob(JOB_ID, input({ publish: true }));
    expect(m.jobUpdate.mock.calls[0]![0].data.publishedAt).toBe(first);
  });

  it('stamps publishedAt on first publish of a draft', async () => {
    m.jobFindFirst.mockResolvedValueOnce({ id: JOB_ID, publishedAt: null }).mockResolvedValueOnce(null);
    await updateJob(JOB_ID, input({ publish: true }));
    expect(m.jobUpdate.mock.calls[0]![0].data.publishedAt).toBeInstanceOf(Date);
  });

  it('reindexes and invalidates the JD, list, and company caches', async () => {
    m.jobFindFirst.mockResolvedValueOnce({ id: JOB_ID, publishedAt: new Date() }).mockResolvedValueOnce(null);
    await updateJob(JOB_ID, input());
    await vi.waitFor(() => expect(m.reindexJob).toHaveBeenCalledWith(JOB_ID));
    expect(m.updateTag).toHaveBeenCalledWith(`job:${JOB_ID}`);
    expect(m.updateTag).toHaveBeenCalledWith('jobs');
    expect(m.updateTag).toHaveBeenCalledWith('company:company1');
  });

  it('rejects a duplicate title among the company\'s other live posts', async () => {
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

  it('de-indexes from Algolia after archiving', async () => {
    m.jobFindFirst.mockResolvedValue({ id: JOB_ID });
    await archiveJob(JOB_ID);
    await vi.waitFor(() => expect(m.reindexJob).toHaveBeenCalledWith(JOB_ID));
  });
});
