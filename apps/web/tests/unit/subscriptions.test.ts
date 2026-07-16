import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

// Seeker follows a company as EMPLOYABLE or VIRTUAL_INTERN (JOB_UC_07): the
// seeker must hold a matching profile, one subscription per type, and the
// company is notified. Re-subscribing is an idempotent no-op.

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
    requireRole: vi.fn(),
    profileFindUnique: vi.fn(),
    companyFindUnique: vi.fn(),
    subFindUnique: vi.fn(),
    subCreate: vi.fn(),
    subDelete: vi.fn(),
    notifCreate: vi.fn(),
    updateTag: vi.fn(),
    redirect: vi.fn((url: string) => {
      throw new RedirectError(url);
    }),
  };
});

vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole, AuthError: m.AuthError }));
vi.mock('@/lib/db', () => ({
  db: {
    jobSeekerProfile: { findUnique: m.profileFindUnique },
    companyProfile: { findUnique: m.companyFindUnique },
    companySubscription: { findUnique: m.subFindUnique },
  },
}));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      companySubscription: { create: m.subCreate, delete: m.subDelete },
      notification: { create: m.notifCreate },
    }),
}));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/navigation', () => ({ redirect: m.redirect }));

import { subscribeToCompany, unsubscribeFromCompany } from '@/app/actions/subscriptions';

const P2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
  code: 'P2002',
  clientVersion: 'test',
});

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue({ id: 'seeker1', firstName: 'Sam', lastName: 'Lee' });
  m.profileFindUnique.mockResolvedValue({ profileType: 'EMPLOYABLE' });
  m.companyFindUnique.mockResolvedValue({ userId: 'company1', companyName: 'Acme' });
  m.subCreate.mockResolvedValue({ id: 'sub1' });
  m.subDelete.mockResolvedValue({});
  m.notifCreate.mockResolvedValue({});
  m.subFindUnique.mockResolvedValue(null);
});

describe('subscribeToCompany', () => {
  it('propagates the auth error for non-seekers', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(subscribeToCompany('company1', 'EMPLOYABLE')).rejects.toThrow();
    expect(m.subCreate).not.toHaveBeenCalled();
  });

  it('routes to onboarding when the seeker has no profile yet', async () => {
    m.profileFindUnique.mockResolvedValue(null);
    await expect(subscribeToCompany('company1', 'EMPLOYABLE')).rejects.toThrow('/onboarding');
    expect(m.subCreate).not.toHaveBeenCalled();
  });

  it('routes to the profile page when the profile type does not match', async () => {
    m.profileFindUnique.mockResolvedValue({ profileType: 'EMPLOYABLE' });
    await expect(subscribeToCompany('company1', 'VIRTUAL_INTERN')).rejects.toThrow(
      '/jobseeker/profile',
    );
    expect(m.subCreate).not.toHaveBeenCalled();
  });

  it('rejects when the target company does not exist', async () => {
    m.companyFindUnique.mockResolvedValue(null);
    await expect(subscribeToCompany('company1', 'EMPLOYABLE')).rejects.toThrow('Company not found');
    expect(m.subCreate).not.toHaveBeenCalled();
  });

  it('creates the subscription, notifies the company, and invalidates its cache', async () => {
    await subscribeToCompany('company1', 'EMPLOYABLE');
    expect(m.subCreate).toHaveBeenCalledWith({
      data: { companyId: 'company1', jobSeekerId: 'seeker1', profileType: 'EMPLOYABLE' },
      select: { id: true },
    });
    const notif = m.notifCreate.mock.calls[0]![0].data;
    expect(notif.userId).toBe('company1');
    expect(notif.kind).toBe('NEW_SUBSCRIBER');
    expect(notif.payload.jobSeekerId).toBe('seeker1');
    expect(m.updateTag).toHaveBeenCalledWith('user:company1:notifications');
  });

  it('is an idempotent no-op when already subscribed with this type (P2002)', async () => {
    m.subCreate.mockRejectedValue(P2002);
    await expect(subscribeToCompany('company1', 'EMPLOYABLE')).resolves.toBeUndefined();
    expect(m.updateTag).not.toHaveBeenCalled();
  });
});

describe('unsubscribeFromCompany', () => {
  it('is a no-op when no subscription exists', async () => {
    m.subFindUnique.mockResolvedValue(null);
    await unsubscribeFromCompany('company1', 'EMPLOYABLE');
    expect(m.subDelete).not.toHaveBeenCalled();
  });

  it('deletes the matching subscription', async () => {
    m.subFindUnique.mockResolvedValue({ id: 'sub1' });
    await unsubscribeFromCompany('company1', 'EMPLOYABLE');
    expect(m.subDelete).toHaveBeenCalledWith({ where: { id: 'sub1' } });
  });
});
