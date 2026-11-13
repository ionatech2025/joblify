import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  redirectToSignIn: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: m.auth, currentUser: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { user: { findUnique: m.userFindUnique } } }));

import { AuthError, requireUser } from '@/lib/auth';

// Clerk's redirectToSignIn() throws Next's redirect and never returns.
class Redirected extends Error {}

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
    m.redirectToSignIn.mockImplementation(() => {
      throw new Redirected('sign-in with return url');
    });
  });

  it('returns the local user when signed in', async () => {
    m.auth.mockResolvedValue({ userId: 'clerk_1', redirectToSignIn: m.redirectToSignIn });
    m.userFindUnique.mockResolvedValue({ id: 'u1', deletedAt: null });
    await expect(requireUser()).resolves.toMatchObject({ id: 'u1' });
  });

  it('sends a signed-out caller to sign-in with a way back to the page it was on', async () => {
    m.auth.mockResolvedValue({ userId: null, redirectToSignIn: m.redirectToSignIn });
    await expect(requireUser()).rejects.toThrow('sign-in with return url');
  });
});
