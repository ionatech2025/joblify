import { vi, describe, it, expect, beforeEach } from 'vitest';

// Trust & safety: an ADMIN verifies or rejects a company's self-submitted
// profile. First real capability behind the ADMIN role — see app/admin.

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
    profileFindUnique: vi.fn(),
    profileUpdate: vi.fn(),
    notifCreate: vi.fn(),
    updateTag: vi.fn(),
  };
});

vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole, AuthError: m.AuthError }));
vi.mock('@/lib/db', () => ({
  db: { companyProfile: { findUnique: m.profileFindUnique } },
}));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      companyProfile: { update: m.profileUpdate },
      notification: { create: m.notifCreate },
    }),
}));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

import { verifyCompany } from '@/app/actions/admin';

const PROFILE_ID = '11111111-1111-1111-1111-111111111111';

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue({ id: 'admin1' });
  m.profileFindUnique.mockResolvedValue({
    id: PROFILE_ID,
    userId: 'company1',
    companyName: 'Acme Inc',
    verificationStatus: 'PENDING',
  });
  m.profileUpdate.mockResolvedValue({});
  m.notifCreate.mockResolvedValue({});
});

describe('verifyCompany', () => {
  it('propagates the auth error for non-admins', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(verifyCompany(PROFILE_ID, 'VERIFIED')).rejects.toThrow();
    expect(m.profileUpdate).not.toHaveBeenCalled();
  });

  it('rejects an unknown company profile', async () => {
    m.profileFindUnique.mockResolvedValue(null);
    expect(await verifyCompany(PROFILE_ID, 'VERIFIED')).toMatchObject({
      ok: false,
      error: expect.stringMatching('not found'),
    });
    expect(m.profileUpdate).not.toHaveBeenCalled();
  });

  it('verifies a company and notifies it', async () => {
    await verifyCompany(PROFILE_ID, 'VERIFIED');
    expect(m.profileUpdate.mock.calls[0]![0].data.verificationStatus).toBe('VERIFIED');
    const notif = m.notifCreate.mock.calls[0]![0].data;
    expect(notif.userId).toBe('company1');
    expect(notif.kind).toBe('ACCOUNT_UPDATE');
    expect(notif.payload.message).toMatch(/verified/i);
    expect(m.updateTag).toHaveBeenCalledWith('company:company1');
    expect(m.updateTag).toHaveBeenCalledWith('companies');
    expect(m.updateTag).toHaveBeenCalledWith('user:company1:notifications');
  });

  it('rejects a company and includes the reason in the notification', async () => {
    await verifyCompany(PROFILE_ID, 'REJECTED', 'Missing business registration');
    expect(m.profileUpdate.mock.calls[0]![0].data.verificationStatus).toBe('REJECTED');
    const notif = m.notifCreate.mock.calls[0]![0].data;
    expect(notif.payload.message).toContain('Missing business registration');
  });
});
