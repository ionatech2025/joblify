import { vi, describe, it, expect, beforeEach } from 'vitest';

// Role-aware post-auth router (flowchart: "Company or Job seeker?"). This is
// the page every sign-in and every sign-up — including Google OAuth, whose
// Clerk widget can only fallbackRedirectUrl to a fixed path, not branch on
// role/profile itself — lands on immediately after a session is established.

const m = vi.hoisted(() => {
  class RedirectError extends Error {
    constructor(public url: string) {
      super(url);
      this.name = 'RedirectError';
    }
  }
  return {
    RedirectError,
    requireUser: vi.fn(),
    findUnique: vi.fn(),
    redirect: vi.fn((url: string) => {
      throw new RedirectError(url);
    }),
  };
});

vi.mock('@/lib/auth', () => ({ requireUser: m.requireUser }));
vi.mock('@/lib/db', () => ({ db: { jobSeekerProfile: { findUnique: m.findUnique } } }));
vi.mock('next/navigation', () => ({ redirect: m.redirect }));

import DashboardLandingPage from '@/app/(authenticated)/dashboard/page';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DashboardLandingPage', () => {
  it('sends a company straight to their jobs list, without a profile lookup', async () => {
    m.requireUser.mockResolvedValue({ id: 'u1', userType: 'COMPANY' });
    await expect(DashboardLandingPage()).rejects.toThrow('/company/jobs');
    expect(m.findUnique).not.toHaveBeenCalled();
  });

  it('sends an admin to /admin, without a profile lookup', async () => {
    m.requireUser.mockResolvedValue({ id: 'u1', userType: 'ADMIN' });
    await expect(DashboardLandingPage()).rejects.toThrow('/admin');
    expect(m.findUnique).not.toHaveBeenCalled();
  });

  // The one branch a brand-new OAuth signup (Google included) always takes:
  // Clerk lands them here with a session but no JobSeekerProfile row yet.
  it('sends a brand-new job seeker with no profile to onboarding', async () => {
    m.requireUser.mockResolvedValue({ id: 'u1', userType: 'JOB_SEEKER' });
    m.findUnique.mockResolvedValue(null);
    await expect(DashboardLandingPage()).rejects.toThrow('/onboarding');
    expect(m.findUnique).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      select: { id: true },
    });
  });

  it('sends an already-onboarded job seeker straight to their applications', async () => {
    m.requireUser.mockResolvedValue({ id: 'u1', userType: 'JOB_SEEKER' });
    m.findUnique.mockResolvedValue({ id: 'profile1' });
    await expect(DashboardLandingPage()).rejects.toThrow('/jobseeker/applications');
  });
});
