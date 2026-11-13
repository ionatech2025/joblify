import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  redirectToSignIn: vi.fn(),
  userFindUnique: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: m.auth, currentUser: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: m.redirect }));
vi.mock('@/lib/db', () => ({ db: { user: { findUnique: m.userFindUnique } } }));

import { AuthError, requireUser } from '@/lib/auth';

// next/navigation's redirect() never returns; the mocks throw the same way so
// the first redirect taken is the one the test sees.
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
    m.redirect.mockImplementation(() => {
      throw new Redirected('plain sign-in');
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
    expect(m.redirect).not.toHaveBeenCalled();
  });

  it('does not send a live session with no usable account back to the page (no sign-in loop)', async () => {
    m.auth.mockResolvedValue({ userId: 'clerk_1', redirectToSignIn: m.redirectToSignIn });
    m.userFindUnique.mockResolvedValue({ id: 'u1', deletedAt: new Date() });
    await expect(requireUser()).rejects.toThrow('plain sign-in');
    expect(m.redirect).toHaveBeenCalledWith('/sign-in');
    expect(m.redirectToSignIn).not.toHaveBeenCalled();
  });
});
