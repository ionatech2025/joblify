import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCompanyProfile } from '@/app/actions/company';

const m = vi.hoisted(() => ({
  requireUser: vi.fn(),
  companyFindUnique: vi.fn(),
  companyFindFirst: vi.fn(),
  companyCreate: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireUser: m.requireUser,
  requireRole: vi.fn(),
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
      companyProfile: { create: m.companyCreate },
    }),
}));

vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/cache', () => ({ updateTag: vi.fn() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

// createCompanyProfile's duplicate-name guard — the one test in the retired
// "Phase 1" auth suite that exercised live code. The rest asserted the legacy
// Mongo-era registration/login schema (deleted: sign-up and sign-in are Clerk's)
// or inline functions that proved only themselves.
describe('createCompanyProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.requireUser.mockResolvedValue({ id: 'user-1', email: 'jim@ymail.com' });
    m.companyFindUnique.mockResolvedValue(null);
    m.companyFindFirst.mockResolvedValue(null);
    m.companyCreate.mockResolvedValue({ id: 'comp-1' });
    m.userUpdate.mockResolvedValue({});
  });

  it('rejects a company name that is already registered', async () => {
    m.companyFindFirst.mockResolvedValue({ id: 'existing-id' });
    await expect(
      createCompanyProfile({
        companyName: 'Acme Technologies',
        industry: 'TECHNOLOGY',
        companySize: 'SIZE_51_200',
        description: 'Building world class technology solutions for enterprises.',
      }),
    ).rejects.toThrow(/already registered/i);
  });
});
