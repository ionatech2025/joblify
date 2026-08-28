import { vi, describe, it, expect, beforeEach } from 'vitest';

// Job-seeker onboarding (JOB_UC_01): pick Employable vs Virtual Intern, which
// creates the JobSeekerProfile with that type and routes on to the profile form.

const m = vi.hoisted(() => {
  class AuthError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.name = 'AuthError';
      this.code = code;
    }
  }
  class RedirectError extends Error {
    constructor(public url: string) {
      super(url);
      this.name = 'RedirectError';
    }
  }
  return {
    AuthError,
    RedirectError,
    requireUser: vi.fn(),
    profileUpsert: vi.fn(),
    respondToInvitation: vi.fn(),
    // next/server's after() needs a real request scope, which unit tests don't
    // have. Collecting the callbacks instead of dropping them lets the tests
    // assert both halves of the deferral: that the redirect does not wait, and
    // that the work still runs afterwards.
    afterCallbacks: [] as Array<() => unknown>,
    redirect: vi.fn((url: string) => {
      throw new RedirectError(url);
    }),
  };
});

vi.mock('@/lib/auth', () => ({ requireUser: m.requireUser, AuthError: m.AuthError }));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({ jobSeekerProfile: { upsert: m.profileUpsert } }),
}));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/server', () => ({
  after: (fn: () => unknown) => {
    m.afterCallbacks.push(fn);
  },
}));
vi.mock('next/navigation', () => ({ redirect: m.redirect }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/app/actions/invitations', () => ({ respondToInvitation: m.respondToInvitation }));

import { completeJobSeekerOnboarding } from '@/app/actions/onboarding';

function form(profileType: unknown, invitationId?: string): FormData {
  const fd = new FormData();
  if (profileType !== undefined) fd.set('profileType', profileType as string);
  if (invitationId !== undefined) fd.set('invitationId', invitationId);
  return fd;
}

/** Runs whatever the action handed to after(), the way the runtime would. */
async function flushAfter(): Promise<void> {
  const queued = m.afterCallbacks.splice(0);
  for (const fn of queued) await fn();
}

beforeEach(() => {
  vi.clearAllMocks();
  m.afterCallbacks.length = 0;
  m.requireUser.mockResolvedValue({ id: 'seeker1', userType: 'JOB_SEEKER' });
  m.profileUpsert.mockResolvedValue({ id: 'profile1' });
  m.respondToInvitation.mockResolvedValue(undefined);
});

describe('completeJobSeekerOnboarding', () => {
  it('forbids a non-jobseeker and writes nothing', async () => {
    m.requireUser.mockResolvedValue({ id: 'company1', userType: 'COMPANY' });
    await expect(completeJobSeekerOnboarding(form('EMPLOYABLE'))).rejects.toThrow();
    expect(m.profileUpsert).not.toHaveBeenCalled();
  });

  it('rejects an unknown profile type before writing', async () => {
    await expect(completeJobSeekerOnboarding(form('BOGUS'))).rejects.toThrow();
    expect(m.profileUpsert).not.toHaveBeenCalled();
  });

  it('creates an EMPLOYABLE profile and routes to the profile form', async () => {
    await expect(completeJobSeekerOnboarding(form('EMPLOYABLE'))).rejects.toThrow(
      '/jobseeker/profile',
    );
    expect(m.profileUpsert).toHaveBeenCalledWith({
      where: { userId: 'seeker1' },
      create: { userId: 'seeker1', profileType: 'EMPLOYABLE' },
      update: { profileType: 'EMPLOYABLE' },
    });
    expect(m.redirect).toHaveBeenCalledWith('/jobseeker/profile');
  });

  it('creates a VIRTUAL_INTERN profile when that path is chosen', async () => {
    await expect(completeJobSeekerOnboarding(form('VIRTUAL_INTERN'))).rejects.toThrow(
      '/jobseeker/profile',
    );
    const arg = m.profileUpsert.mock.calls[0]![0];
    expect(arg.create.profileType).toBe('VIRTUAL_INTERN');
    expect(arg.update.profileType).toBe('VIRTUAL_INTERN');
  });

  it('does not touch invitations when none was pending', async () => {
    await expect(completeJobSeekerOnboarding(form('EMPLOYABLE'))).rejects.toThrow();
    expect(m.afterCallbacks).toHaveLength(0);
    await flushAfter();
    expect(m.respondToInvitation).not.toHaveBeenCalled();
  });

  // respondToInvitation redirects here mid-accept when a seeker has no
  // profile yet (see app/actions/invitations.ts); onboarding must finish
  // that accept once the profile exists, or the original "Accept" click is
  // silently lost.
  it('resumes a pending invitation accept after the profile is created', async () => {
    await expect(completeJobSeekerOnboarding(form('EMPLOYABLE', 'inv1'))).rejects.toThrow(
      '/jobseeker/profile',
    );
    expect(m.profileUpsert).toHaveBeenCalled();

    // The accept is deferred with after(), so the user is redirected without
    // waiting on a second round of writes — it must not have run yet.
    expect(m.respondToInvitation).not.toHaveBeenCalled();

    await flushAfter();
    expect(m.respondToInvitation).toHaveBeenCalledWith('inv1', 'ACCEPT');
  });

  it('still completes onboarding if the resumed invitation accept fails', async () => {
    m.respondToInvitation.mockRejectedValue(new Error('invitation expired'));
    await expect(completeJobSeekerOnboarding(form('EMPLOYABLE', 'inv1'))).rejects.toThrow(
      '/jobseeker/profile',
    );
    expect(m.redirect).toHaveBeenCalledWith('/jobseeker/profile');
    // A failure in the deferred work must stay contained — it is caught and
    // logged, never rethrown into the response that has already been sent.
    await expect(flushAfter()).resolves.toBeUndefined();
  });
});
