import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCompanyProfile, updateCompanyProfile } from '@/app/actions/company';

const m = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
  companyFindUnique: vi.fn(),
  companyFindFirst: vi.fn(),
  companyCreate: vi.fn(),
  companyUpdate: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireUser: m.requireUser,
  requireRole: m.requireRole,
  AuthError: class extends Error {
    constructor(public code: string) {
      super(code);
    }
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    companyProfile: {
      findUnique: m.companyFindUnique,
      findFirst: m.companyFindFirst,
    },
    user: {
      update: m.userUpdate,
    },
  },
}));

vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      user: { update: m.userUpdate },
      companyProfile: { create: m.companyCreate, update: m.companyUpdate },
    }),
}));

vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/cache', () => ({ updateTag: vi.fn() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

const PROFILE = {
  companyName: 'Acme Technologies',
  industry: 'TECHNOLOGY' as const,
  companySize: 'SIZE_51_200' as const,
  description: 'Building world class technology solutions for enterprises.',
  website: 'https://acme.example',
};

beforeEach(() => {
  vi.clearAllMocks();
  m.requireUser.mockResolvedValue({ id: 'user-1', email: 'jim@ymail.com' });
  m.requireRole.mockResolvedValue({ id: 'user-1', email: 'jim@ymail.com' });
  m.companyFindUnique.mockResolvedValue(null);
  m.companyFindFirst.mockResolvedValue(null);
  m.companyCreate.mockResolvedValue({ id: 'comp-1' });
  m.companyUpdate.mockResolvedValue({ id: 'comp-1' });
  m.userUpdate.mockResolvedValue({});
});

// Expected failures come back as results: a thrown message is replaced by a
// generic one in production builds, so the user never saw "already registered".
describe('createCompanyProfile', () => {
  it('creates the profile', async () => {
    expect(await createCompanyProfile(PROFILE)).toEqual({ ok: true, data: undefined });
    expect(m.companyCreate).toHaveBeenCalled();
  });

  it('returns, not throws, a company name that is already registered', async () => {
    m.companyFindFirst.mockResolvedValue({ id: 'existing-id' });
    expect(await createCompanyProfile(PROFILE)).toEqual({
      ok: false,
      error: 'A company with this name is already registered.',
    });
    expect(m.companyCreate).not.toHaveBeenCalled();
  });

  it('returns the schema message for invalid input', async () => {
    expect(await createCompanyProfile({ ...PROFILE, description: 'short' })).toEqual({
      ok: false,
      error: 'Description must be at least 20 characters',
    });
    expect(m.companyCreate).not.toHaveBeenCalled();
  });
});

describe('updateCompanyProfile', () => {
  const stored = (verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED') => ({
    id: 'comp-1',
    logoUrl: null,
    companyName: PROFILE.companyName,
    website: PROFILE.website,
    verificationStatus,
  });

  it.each([
    ['name', { companyName: 'Acme Bank' }],
    ['website', { website: 'https://acme-bank.example' }],
  ])('refuses to change a verified company %s', async (_field, change) => {
    m.companyFindUnique.mockResolvedValue(stored('VERIFIED'));
    const res = await updateCompanyProfile({ ...PROFILE, ...change });
    expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/once verified/i) });
    expect(m.companyUpdate).not.toHaveBeenCalled();
  });

  it('lets a verified company edit everything else and stay verified', async () => {
    m.companyFindUnique.mockResolvedValue(stored('VERIFIED'));
    const res = await updateCompanyProfile({
      ...PROFILE,
      description: 'A new, longer company story.',
    });
    expect(res).toEqual({ ok: true, data: undefined });
    const { data } = m.companyUpdate.mock.calls[0]![0];
    expect(data.description).toBe('A new, longer company story.');
    expect(data).not.toHaveProperty('verificationStatus');
  });

  it('resubmits a rejected company: back to PENDING with the old reason cleared', async () => {
    m.companyFindUnique.mockResolvedValue(stored('REJECTED'));
    const res = await updateCompanyProfile({ ...PROFILE, companyName: 'Acme Technologies Ltd' });
    expect(res).toEqual({ ok: true, data: undefined });
    expect(m.companyUpdate.mock.calls[0]![0].data).toMatchObject({
      companyName: 'Acme Technologies Ltd',
      verificationStatus: 'PENDING',
      rejectionReason: null,
    });
  });

  it('returns the schema message for invalid input', async () => {
    m.companyFindUnique.mockResolvedValue(stored('VERIFIED'));
    expect(await updateCompanyProfile({ ...PROFILE, website: 'not a url' })).toEqual({
      ok: false,
      error: 'Invalid website URL',
    });
    expect(m.companyUpdate).not.toHaveBeenCalled();
  });
});
