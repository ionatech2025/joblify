// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The header bell's one destination. Each role must land on a list it can
// open, including a company the company console still turns away.

const m = vi.hoisted(() => {
  class RedirectError extends Error {
    constructor(public url: string) {
      super(url);
    }
  }
  return {
    RedirectError,
    requireUser: vi.fn(),
    companyProfile: vi.fn(),
    notifications: vi.fn(),
    redirect: vi.fn((url: string) => {
      throw new RedirectError(url);
    }),
  };
});

vi.mock('@/lib/auth', () => ({ requireUser: m.requireUser }));
vi.mock('@/lib/db', () => ({
  db: {
    companyProfile: { findUnique: m.companyProfile },
    notification: { findMany: m.notifications },
  },
}));
vi.mock('next/navigation', () => ({ redirect: m.redirect }));

import NotificationsLandingPage from '@/app/(authenticated)/dashboard/notifications/page';

const REJECTION = 'Acme was not verified. Reason: documents unreadable';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise<never>(() => {})));
  m.notifications.mockResolvedValue([
    {
      id: 'n1',
      kind: 'ACCOUNT_UPDATE',
      payload: { message: REJECTION, verificationStatus: 'REJECTED' },
      readAt: null,
      createdAt: new Date('2026-11-20T10:00:00Z'),
    },
  ]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

async function renderPage() {
  const page = await NotificationsLandingPage();
  render(<QueryClientProvider client={new QueryClient()}>{page}</QueryClientProvider>);
}

describe('/dashboard/notifications', () => {
  it('sends a job seeker to their notifications, without a company lookup', async () => {
    m.requireUser.mockResolvedValue({ id: 'u1', userType: 'JOB_SEEKER' });
    await expect(NotificationsLandingPage()).rejects.toThrow('/jobseeker/notifications');
    expect(m.companyProfile).not.toHaveBeenCalled();
  });

  it('sends an admin to /admin', async () => {
    m.requireUser.mockResolvedValue({ id: 'u1', userType: 'ADMIN' });
    await expect(NotificationsLandingPage()).rejects.toThrow('/admin');
  });

  it('sends a verified company to the company console list', async () => {
    m.requireUser.mockResolvedValue({ id: 'c1', userType: 'COMPANY' });
    m.companyProfile.mockResolvedValue({ verificationStatus: 'VERIFIED' });
    await expect(NotificationsLandingPage()).rejects.toThrow('/company/notifications');
    expect(m.companyProfile).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'c1' } }),
    );
  });

  it.each([
    ['rejected', { verificationStatus: 'REJECTED' }],
    ['pending', { verificationStatus: 'PENDING' }],
    ['missing', null],
  ])('shows a company whose profile is %s its own list here', async (_, profile) => {
    m.requireUser.mockResolvedValue({ id: 'c1', userType: 'COMPANY' });
    m.companyProfile.mockResolvedValue(profile);
    await renderPage();

    expect(m.redirect).not.toHaveBeenCalled();
    expect(m.notifications).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'c1' } }),
    );
    expect(screen.getByText(REJECTION)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to employer setup' }).getAttribute('href')).toBe(
      '/employer-setup',
    );
  });
});
