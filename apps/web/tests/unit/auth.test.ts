import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  redirectToSignIn: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: m.auth, currentUser: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { user: { findUnique: m.userFindUnique } } }));

import { AuthError, requireUser } from '@/lib/auth';

// Clerk's redirectToSignIn() throws Next's redirect and never returns. Like the
// real one, it sends the caller back to the request's own URL unless the
// caller passes another, or null for none.
class Redirected extends Error {}
const PAGE = 'https://joblify.test/jobs/eng/apply';

describe('AuthError', () => {
  it('carries a code', () => {
    const e = new AuthError('FORBIDDEN');
    expect(e.code).toBe('FORBIDDEN');
    expect(e.name).toBe('AuthError');
  });
});

describe('requireUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.redirectToSignIn.mockImplementation((opts: { returnBackUrl?: string | null } = {}) => {
      const back = opts.returnBackUrl === null ? '' : (opts.returnBackUrl ?? PAGE);
      throw new Redirected(`/sign-in?redirect_url=${encodeURIComponent(back)}`);
    });
  });

  it('returns the local user when signed in', async () => {
    m.auth.mockResolvedValue({ userId: 'clerk_1', redirectToSignIn: m.redirectToSignIn });
    m.userFindUnique.mockResolvedValue({ id: 'u1', deletedAt: null });
    await expect(requireUser()).resolves.toMatchObject({ id: 'u1' });
  });

  it('sends a signed-out caller to sign-in with a way back to the page it was on', async () => {
    m.auth.mockResolvedValue({ userId: null, redirectToSignIn: m.redirectToSignIn });
    await expect(requireUser()).rejects.toThrow(`redirect_url=${encodeURIComponent(PAGE)}`);
  });
});
