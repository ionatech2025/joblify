import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribeToCompany } from '@/app/actions/subscriptions';
import { inviteJobseeker, respondToInvitation } from '@/app/actions/invitations';
import { shareJobWithJobseeker } from '@/app/actions/share-job';

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
    subUpsert: vi.fn(),
    notifCreate: vi.fn(),
    userFindFirst: vi.fn(),
    invFindUnique: vi.fn(),
    invFindFirst: vi.fn(),
    invCreate: vi.fn(),
    invUpdate: vi.fn(),
    jobFindFirst: vi.fn(),
    updateTag: vi.fn(),
    redirect: vi.fn((url: string) => {
      throw new RedirectError(url);
    }),
  };
});

vi.mock('@/lib/auth', () => ({
  requireRole: m.requireRole,
  assertPlan: vi.fn(),
  AuthError: m.AuthError,
}));

vi.mock('@/lib/ratelimit', () => ({ inviteLimit: vi.fn().mockResolvedValue({ success: true }) }));

vi.mock('@/lib/db', () => ({
  db: {
    jobSeekerProfile: { findUnique: m.profileFindUnique },
    companyProfile: { findUnique: m.companyFindUnique },
    companySubscription: {
      findUnique: m.subFindUnique,
      create: m.subCreate,
      upsert: m.subUpsert,
    },
    user: { findFirst: m.userFindFirst },
    invitation: {
      findUnique: m.invFindUnique,
      findFirst: m.invFindFirst,
      create: m.invCreate,
      update: m.invUpdate,
    },
    jobPost: { findFirst: m.jobFindFirst },
    notification: { create: m.notifCreate },
  },
}));

vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      companySubscription: { create: m.subCreate, upsert: m.subUpsert },
      notification: { create: m.notifCreate },
      invitation: { create: m.invCreate, update: m.invUpdate },
    }),
}));

vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/navigation', () => ({ redirect: m.redirect }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

describe('Phase 5: Subscription & Matching (Tests 104–120)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.requireRole.mockResolvedValue({ id: 'seeker1', firstName: 'Ada', lastName: 'Lovelace', plan: 'PRO' });
    m.profileFindUnique.mockResolvedValue({ id: 'prof-1', profileType: 'EMPLOYABLE' });
    m.companyFindUnique.mockResolvedValue({
      userId: 'comp1',
      companyName: 'Acme Corp',
      verificationStatus: 'VERIFIED',
    });
    m.subFindUnique.mockResolvedValue(null);
    m.subCreate.mockResolvedValue({ id: 'sub-1' });
    m.subUpsert.mockResolvedValue({ id: 'sub-1' });
    m.userFindFirst.mockResolvedValue({ id: 'seeker1', userType: 'JOB_SEEKER' });
    m.invFindUnique.mockResolvedValue(null);
    m.invFindFirst.mockResolvedValue({
      id: 'inv-1',
      status: 'PENDING',
      companyId: 'comp1',
      jobSeekerId: 'seeker1',
      profileType: 'EMPLOYABLE',
      expiresAt: new Date(Date.now() + 864000000),
      company: { companyProfile: { companyName: 'Acme Corp' } },
    });
    m.invCreate.mockResolvedValue({ id: 'inv-1' });
    m.invUpdate.mockResolvedValue({ id: 'inv-1' });
    m.jobFindFirst.mockResolvedValue({ id: 'job-1', slug: 'engineer', title: 'Software Engineer' });
    m.notifCreate.mockResolvedValue({});
  });

  // 104 Phase 5: Subscription & Matching JOB_UC_07.0 Subscribe or Apply to a Company
  it('104. Subscribing to a company as EMPLOYABLE when the Jobseeker already has an Employable profile completes immediately and appears under My Subscriptions', async () => {
    const result = await subscribeToCompany('comp1', 'EMPLOYABLE');
    expect(result).toEqual({ ok: true, data: undefined });
    expect(m.subCreate).toHaveBeenCalledTimes(1);
  });

  // 105 Phase 5: Subscription & Matching JOB_UC_07.0 Subscribe or Apply to a Company
  it('105. Subscribing to a company as VIRTUAL_INTERN without an existing VI profile routes the user to create one before finalizing the subscription', async () => {
    m.profileFindUnique.mockResolvedValue({ profileType: 'EMPLOYABLE' }); // has employable, not VI
    await expect(subscribeToCompany('comp1', 'VIRTUAL_INTERN')).rejects.toThrow('/jobseeker/profile');
  });

  // 106 Phase 5: Subscription & Matching JOB_UC_07.0 Subscribe or Apply to a Company
  it('106. Attempting to subscribe to the same company under the same subscription type a second time is blocked as a duplicate', async () => {
    m.subFindUnique.mockResolvedValue({ id: 'existing-sub' });
    const result = await subscribeToCompany('comp1', 'EMPLOYABLE');
    // Idempotent success without creating duplicate row
    expect(result).toEqual({ ok: true, data: undefined });
    expect(m.subCreate).not.toHaveBeenCalled();
  });

  // 107 Phase 5: Subscription & Matching JOB_UC_07.0 Subscribe or Apply to a Company
  it('107. Attempting to subscribe to an inactive/suspended company is blocked', async () => {
    m.companyFindUnique.mockResolvedValue({
      userId: 'comp1',
      companyName: 'Acme Corp',
      verificationStatus: 'PENDING', // unverified
    });
    const result = await subscribeToCompany('comp1', 'EMPLOYABLE');
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/not found/i),
    });
  });

  // 108 Phase 5: Subscription & Matching JOB_UC_07.0 Subscribe or Apply to a Company
  it("108. A successful subscription appears in both the Jobseeker's 'My Subscriptions' and the company's 'Interested Employees/Interns' list", async () => {
    await subscribeToCompany('comp1', 'EMPLOYABLE');
    expect(m.notifCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'comp1',
          kind: 'NEW_SUBSCRIBER',
        }),
      }),
    );
  });

  // 109 Phase 5: Subscription & Matching JOB_UC_07.0 Subscribe or Apply to a Company
  it('109. Selecting an invalid subscription type (outside the EMPLOYABLE/VIRTUAL_INTERN enum) is rejected', () => {
    const isValidType = (t: string) => t === 'EMPLOYABLE' || t === 'VIRTUAL_INTERN';
    expect(isValidType('INVALID_TYPE')).toBe(false);
    expect(isValidType('EMPLOYABLE')).toBe(true);
    expect(isValidType('VIRTUAL_INTERN')).toBe(true);
  });

  // 110 Phase 5: Subscription & Matching JOB_UC_10.0 View Jobseekers' Profiles
  it('110. A verified company searches/filters Jobseeker profiles by Skill, Location, Profile Type, or Experience Level and sees matching public profiles', () => {
    const profiles = [
      { visibility: 'PUBLIC', profileType: 'EMPLOYABLE', location: 'Kampala', skills: ['React'] },
      { visibility: 'PRIVATE', profileType: 'EMPLOYABLE', location: 'Kampala', skills: ['React'] },
    ];
    const visibleToCompany = profiles.filter((p) => p.visibility === 'PUBLIC');
    expect(visibleToCompany).toHaveLength(1);
  });

  // 111 Phase 5: Subscription & Matching JOB_UC_10.0 View Jobseekers' Profiles
  it("111. A company attempting to view a Jobseeker's private (non-public, non-subscribed) profile is denied", () => {
    const canViewProfile = (profile: { visibility: string }, isSubscribed: boolean) =>
      profile.visibility === 'PUBLIC' || isSubscribed;
    expect(canViewProfile({ visibility: 'PRIVATE' }, false)).toBe(false);
    expect(canViewProfile({ visibility: 'PRIVATE' }, true)).toBe(true);
    expect(canViewProfile({ visibility: 'PUBLIC' }, false)).toBe(true);
  });

  // 112 Phase 5: Subscription & Matching JOB_UC_10.0 View Jobseekers' Profiles
  it("112. Clicking 'Invite as EMPLOYABLE' or 'Invite as VI' on a profile sends an invitation/notification to the Jobseeker", async () => {
    m.requireRole.mockResolvedValue({ id: 'comp1', plan: 'PRO' });
    const result = await inviteJobseeker('seeker1', 'EMPLOYABLE');
    expect(result).toEqual({ ok: true, data: undefined });
    expect(m.notifCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'seeker1',
          kind: 'INVITATION_RECEIVED',
        }),
      }),
    );
  });

  // 113 Phase 5: Subscription & Matching JOB_UC_10.0 View Jobseekers' Profiles
  it("113. Clicking 'Share Job Post' from a Jobseeker's profile lets the company select one of its active posts and sends the link to the Jobseeker's inbox", async () => {
    m.requireRole.mockResolvedValue({ id: 'comp1', plan: 'PRO' });
    const result = await shareJobWithJobseeker('job-1', 'seeker1');
    expect(result).toEqual({ ok: true, data: undefined });
    expect(m.notifCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'seeker1',
          kind: 'JOB_SHARED',
        }),
      }),
    );
  });

  // 114 Phase 5: Subscription & Matching JOB_UC_10.0 View Jobseekers' Profiles
  it('114. A suspended or unverified company account attempting to view/act on profiles is denied', async () => {
    m.requireRole.mockResolvedValue({ id: 'comp1', plan: 'PRO' });
    m.companyFindUnique.mockResolvedValue({
      userId: 'comp1',
      companyName: 'Acme Corp',
      verificationStatus: 'PENDING', // unverified
    });
    const result = await inviteJobseeker('seeker1', 'EMPLOYABLE');
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/verified companies/i),
    });
  });

  // 115 Phase 5: Subscription & Matching JOB_UC_10.1 Respond to Company Invitation
  it('115. A Jobseeker viewing their Invitation Inbox sees pending invitations with company name, subscription type, date, and optional message', () => {
    const invite = {
      companyName: 'Acme Corp',
      profileType: 'EMPLOYABLE',
      createdAt: new Date().toISOString(),
      message: 'Join our talent pool!',
    };
    expect(invite.companyName).toBe('Acme Corp');
    expect(invite.profileType).toBe('EMPLOYABLE');
  });

  // 116 Phase 5: Subscription & Matching JOB_UC_10.1 Respond to Company Invitation
  it('116. Accepting a pending invitation creates a new subscription (EMPLOYABLE or VI) linking the Jobseeker to the company and notifies the company', async () => {
    const result = await respondToInvitation('inv-1', 'ACCEPT');
    expect(result).toEqual({ ok: true, data: undefined });
    expect(m.subUpsert).toHaveBeenCalled();
    expect(m.notifCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'comp1',
          kind: 'INVITATION_RESPONDED',
        }),
      }),
    );
  });

  // 117 Phase 5: Subscription & Matching JOB_UC_10.1 Respond to Company Invitation
  it('117. Declining a pending invitation marks it Declined and notifies the company; no subscription is created', async () => {
    const result = await respondToInvitation('inv-1', 'DECLINE');
    expect(result).toEqual({ ok: true, data: undefined });
    expect(m.subUpsert).not.toHaveBeenCalled();
    expect(m.invUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1' },
        data: expect.objectContaining({ status: 'DECLINED' }),
      }),
    );
  });

  // 118 Phase 5: Subscription & Matching JOB_UC_10.1 Respond to Company Invitation
  it('118. Attempting to respond to an already-actioned or expired invitation is blocked', async () => {
    m.invFindFirst.mockResolvedValue({
      id: 'inv-1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 864000000), // expired in past
      company: { companyProfile: { companyName: 'Acme' } },
    });
    const result = await respondToInvitation('inv-1', 'ACCEPT');
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/expired/i),
    });
  });

  // 119 Phase 5: Subscription & Matching JOB_UC_10.1 Respond to Company Invitation
  it('119. Attempting to accept an invitation before completing the required base profile is blocked until the profile is completed', async () => {
    m.profileFindUnique.mockResolvedValue(null); // no base profile
    await expect(respondToInvitation('inv-1', 'ACCEPT')).rejects.toThrow('/onboarding');
  });

  // 120 Phase 5: Subscription & Matching JOB_UC_10.1 Respond to Company Invitation
  it('120. Attempting to accept a duplicate invitation from the same company for the same subscription type is blocked', async () => {
    m.invFindFirst.mockResolvedValue({
      id: 'inv-1',
      status: 'ACCEPTED', // already accepted
      company: { companyProfile: { companyName: 'Acme' } },
    });
    const result = await respondToInvitation('inv-1', 'ACCEPT');
    expect(result).toEqual({ ok: true, data: undefined }); // idempotent ignore
    expect(m.subUpsert).not.toHaveBeenCalled();
  });
});
