import { vi, describe, it, expect, beforeEach } from 'vitest';

// Typed invitations (JOB_UC_10): a company invites a seeker to subscribe as
// EMPLOYABLE or VIRTUAL_INTERN; the seeker accepts (which also subscribes) or
// declines. One pending invitation per company/seeker/type.

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
    userFindFirst: vi.fn(),
    companyFindUnique: vi.fn(),
    invFindUnique: vi.fn(),
    invFindFirst: vi.fn(),
    invUpdateDirect: vi.fn(),
    profileFindUnique: vi.fn(),
    invCreate: vi.fn(),
    invUpdate: vi.fn(),
    subUpsert: vi.fn(),
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
    user: { findFirst: m.userFindFirst },
    companyProfile: { findUnique: m.companyFindUnique },
    invitation: {
      findUnique: m.invFindUnique,
      findFirst: m.invFindFirst,
      update: m.invUpdateDirect,
    },
    jobSeekerProfile: { findUnique: m.profileFindUnique },
  },
}));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      invitation: { create: m.invCreate, update: m.invUpdate },
      companySubscription: { upsert: m.subUpsert },
      notification: { create: m.notifCreate },
    }),
}));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/navigation', () => ({ redirect: m.redirect }));

import { inviteJobseeker, respondToInvitation } from '@/app/actions/invitations';

const future = () => new Date(Date.now() + 24 * 60 * 60 * 1000);
const past = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue({ id: 'company1', firstName: 'Sam', lastName: 'Lee' });
  m.userFindFirst.mockResolvedValue({ id: 'seeker1' });
  m.companyFindUnique.mockResolvedValue({ companyName: 'Acme' });
  m.invFindUnique.mockResolvedValue(null);
  m.invCreate.mockResolvedValue({ id: 'inv1' });
  m.invUpdate.mockResolvedValue({ id: 'inv1' });
  m.subUpsert.mockResolvedValue({});
  m.notifCreate.mockResolvedValue({});
});

describe('inviteJobseeker', () => {
  it('propagates the auth error for non-companies', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(inviteJobseeker('seeker1', 'EMPLOYABLE')).rejects.toThrow();
    expect(m.invCreate).not.toHaveBeenCalled();
  });

  it('rejects when the target is not a job seeker', async () => {
    m.userFindFirst.mockResolvedValue(null);
    await expect(inviteJobseeker('seeker1', 'EMPLOYABLE')).rejects.toThrow('Job seeker not found');
    expect(m.invCreate).not.toHaveBeenCalled();
  });

  it('leaves a still-pending invitation untouched', async () => {
    m.invFindUnique.mockResolvedValue({ id: 'inv1', status: 'PENDING' });
    await inviteJobseeker('seeker1', 'EMPLOYABLE');
    expect(m.invCreate).not.toHaveBeenCalled();
    expect(m.invUpdate).not.toHaveBeenCalled();
    expect(m.updateTag).not.toHaveBeenCalled();
  });

  it('creates a fresh invitation and notifies the seeker', async () => {
    await inviteJobseeker('seeker1', 'VIRTUAL_INTERN');
    const data = m.invCreate.mock.calls[0]![0].data;
    expect(data.companyId).toBe('company1');
    expect(data.jobSeekerId).toBe('seeker1');
    expect(data.profileType).toBe('VIRTUAL_INTERN');
    expect(data.expiresAt).toBeInstanceOf(Date);
    const notif = m.notifCreate.mock.calls[0]![0].data;
    expect(notif.userId).toBe('seeker1');
    expect(notif.kind).toBe('INVITATION_RECEIVED');
    expect(m.updateTag).toHaveBeenCalledWith('user:seeker1:notifications');
  });

  it('re-arms a previously declined invitation instead of creating a new one', async () => {
    m.invFindUnique.mockResolvedValue({ id: 'inv1', status: 'DECLINED' });
    await inviteJobseeker('seeker1', 'EMPLOYABLE');
    expect(m.invCreate).not.toHaveBeenCalled();
    const arg = m.invUpdate.mock.calls[0]![0];
    expect(arg.where).toEqual({ id: 'inv1' });
    expect(arg.data.status).toBe('PENDING');
    expect(arg.data.respondedAt).toBeNull();
  });
});

describe('respondToInvitation', () => {
  const INVITATION = {
    id: 'inv1',
    status: 'PENDING',
    companyId: 'company1',
    profileType: 'EMPLOYABLE',
    expiresAt: future(),
    company: { id: 'company1', companyProfile: { companyName: 'Acme' } },
  };

  beforeEach(() => {
    m.requireRole.mockResolvedValue({ id: 'seeker1', firstName: 'Sam', lastName: 'Lee' });
    m.invFindFirst.mockResolvedValue({ ...INVITATION, expiresAt: future() });
    m.profileFindUnique.mockResolvedValue({ id: 'profile1' });
    m.invUpdateDirect.mockResolvedValue({});
  });

  it('rejects an invitation that is not the seeker’s (tenancy)', async () => {
    m.invFindFirst.mockResolvedValue(null);
    await expect(respondToInvitation('inv1', 'ACCEPT')).rejects.toThrow();
    expect(m.invUpdate).not.toHaveBeenCalled();
  });

  it('is a no-op on an already-answered invitation', async () => {
    m.invFindFirst.mockResolvedValue({ ...INVITATION, status: 'ACCEPTED', expiresAt: future() });
    await respondToInvitation('inv1', 'ACCEPT');
    expect(m.invUpdate).not.toHaveBeenCalled();
    expect(m.subUpsert).not.toHaveBeenCalled();
  });

  it('marks an expired invitation EXPIRED and refuses it', async () => {
    m.invFindFirst.mockResolvedValue({ ...INVITATION, expiresAt: past() });
    await expect(respondToInvitation('inv1', 'ACCEPT')).rejects.toThrow('expired');
    expect(m.invUpdateDirect).toHaveBeenCalledWith({
      where: { id: 'inv1' },
      data: { status: 'EXPIRED' },
    });
    expect(m.subUpsert).not.toHaveBeenCalled();
  });

  it('routes to onboarding if the seeker accepts without a base profile', async () => {
    m.profileFindUnique.mockResolvedValue(null);
    await expect(respondToInvitation('inv1', 'ACCEPT')).rejects.toThrow('/onboarding');
    expect(m.subUpsert).not.toHaveBeenCalled();
  });

  it('accepting marks it ACCEPTED, subscribes, and notifies the company', async () => {
    await respondToInvitation('inv1', 'ACCEPT');
    expect(m.invUpdate.mock.calls[0]![0].data.status).toBe('ACCEPTED');
    const sub = m.subUpsert.mock.calls[0]![0];
    expect(sub.create).toEqual({
      companyId: 'company1',
      jobSeekerId: 'seeker1',
      profileType: 'EMPLOYABLE',
    });
    const notif = m.notifCreate.mock.calls[0]![0].data;
    expect(notif.userId).toBe('company1');
    expect(notif.kind).toBe('INVITATION_RESPONDED');
    expect(notif.payload.status).toBe('ACCEPTED');
    expect(m.updateTag).toHaveBeenCalledWith('user:company1:notifications');
  });

  it('declining marks it DECLINED and does not subscribe', async () => {
    await respondToInvitation('inv1', 'DECLINE');
    expect(m.invUpdate.mock.calls[0]![0].data.status).toBe('DECLINED');
    expect(m.subUpsert).not.toHaveBeenCalled();
    expect(m.notifCreate.mock.calls[0]![0].data.payload.status).toBe('DECLINED');
  });
});
