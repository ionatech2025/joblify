import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as AuthModule from '@/lib/auth';

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
    savedJobFindUnique: vi.fn(),
    savedJobDelete: vi.fn(),
    savedJobCreate: vi.fn(),
    jobPostFindFirst: vi.fn(),
    savedSearchCount: vi.fn(),
    savedSearchCreate: vi.fn(),
    savedSearchFindFirst: vi.fn(),
    savedSearchDelete: vi.fn(),
  };
});

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return { ...actual, requireRole: m.requireRole, AuthError: m.AuthError };
});

vi.mock('@/lib/db', () => ({
  db: {
    savedJob: {
      findUnique: m.savedJobFindUnique,
      delete: m.savedJobDelete,
      create: m.savedJobCreate,
    },
    jobPost: {
      findFirst: m.jobPostFindFirst,
    },
    savedSearch: {
      count: m.savedSearchCount,
      create: m.savedSearchCreate,
      findFirst: m.savedSearchFindFirst,
      delete: m.savedSearchDelete,
    },
  },
}));

vi.mock('@/lib/observability/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { toggleSavedJob } from '@/app/actions/saved-jobs';
import { saveSearch, deleteSavedSearch } from '@/app/actions/saved-searches';

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue({ id: 'seeker-1', userType: 'JOB_SEEKER' });
  m.savedJobFindUnique.mockResolvedValue(null);
  m.savedJobDelete.mockResolvedValue({});
  m.savedJobCreate.mockResolvedValue({});
  m.jobPostFindFirst.mockResolvedValue({ id: 'job-1' });
  m.savedSearchCount.mockResolvedValue(0);
  m.savedSearchCreate.mockResolvedValue({});
  m.savedSearchFindFirst.mockResolvedValue({ id: 'search-1' });
  m.savedSearchDelete.mockResolvedValue({});
});

describe('toggleSavedJob', () => {
  it('saves a live published job when not already saved', async () => {
    const res = await toggleSavedJob('job-1');
    expect(res).toEqual({ ok: true, data: { saved: true } });
    expect(m.savedJobCreate).toHaveBeenCalledWith({
      data: { userId: 'seeker-1', jobPostId: 'job-1' },
    });
  });

  it('unsaves an already-saved job', async () => {
    m.savedJobFindUnique.mockResolvedValue({ id: 'saved-1' });
    const res = await toggleSavedJob('job-1');
    expect(res).toEqual({ ok: true, data: { saved: false } });
    expect(m.savedJobDelete).toHaveBeenCalledWith({ where: { id: 'saved-1' } });
    expect(m.savedJobCreate).not.toHaveBeenCalled();
  });

  it('refuses to save a job that is not published or does not exist', async () => {
    m.jobPostFindFirst.mockResolvedValue(null);
    const res = await toggleSavedJob('job-missing');
    expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/not available/i) });
    expect(m.savedJobCreate).not.toHaveBeenCalled();
  });
});

describe('saveSearch and deleteSavedSearch', () => {
  it('creates a saved search with a default label derived from the query', async () => {
    const res = await saveSearch({ query: '?q=rust&workMode=REMOTE' });
    expect(res).toEqual({ ok: true, data: undefined });
    expect(m.savedSearchCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'seeker-1',
        query: 'q=rust&workMode=REMOTE',
      }),
    });
  });

  it('enforces the 20 saved-search cap per user', async () => {
    m.savedSearchCount.mockResolvedValue(20);
    const res = await saveSearch({ query: 'q=engineer' });
    expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/up to 20/i) });
    expect(m.savedSearchCreate).not.toHaveBeenCalled();
  });

  it('deletes a saved search owned by the caller and rejects foreign ids', async () => {
    await deleteSavedSearch('search-1');
    expect(m.savedSearchDelete).toHaveBeenCalledWith({ where: { id: 'search-1' } });

    m.savedSearchFindFirst.mockResolvedValue(null);
    await expect(deleteSavedSearch('other-search')).rejects.toThrow('FORBIDDEN');
  });
});
