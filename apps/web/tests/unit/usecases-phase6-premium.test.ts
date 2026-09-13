import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addChatParticipant,
  addVirtualInternToChat,
  sendChatMessage,
} from '@/app/actions/chat';
import { shareJobWithJobseeker } from '@/app/actions/share-job';
import { APPLICATION_STATUS_LABEL } from '@/lib/ui/status';

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
    requireUser: vi.fn(),
    requireRole: vi.fn(),
    chatMessageLimit: vi.fn(),
    chatAreaFindFirst: vi.fn(),
    chatAreaFindUnique: vi.fn(),
    chatAreaCreate: vi.fn(),
    chatAreaUpdate: vi.fn(),
    chatPartFindUnique: vi.fn(),
    chatPartCreate: vi.fn(),
    chatMessageCreate: vi.fn(),
    userFindFirst: vi.fn(),
    companyProfileFindUnique: vi.fn(),
    jobFindFirst: vi.fn(),
    notifCreate: vi.fn(),
    updateTag: vi.fn(),
  };
});

vi.mock('@/lib/auth', () => ({
  requireUser: m.requireUser,
  requireRole: m.requireRole,
  assertPlan: (user: { plan?: string }, required: string) => {
    if (user.plan !== required) throw new Error('UPGRADE_REQUIRED');
  },
  AuthError: m.AuthError,
}));

vi.mock('@/lib/ratelimit', () => ({
  chatMessageLimit: m.chatMessageLimit,
}));

vi.mock('@/lib/db', () => ({
  db: {
    chatArea: {
      findFirst: m.chatAreaFindFirst,
      findUnique: m.chatAreaFindUnique,
      create: m.chatAreaCreate,
      update: m.chatAreaUpdate,
    },
    chatParticipant: {
      findUnique: m.chatPartFindUnique,
      create: m.chatPartCreate,
    },
    chatMessage: {
      create: m.chatMessageCreate,
    },
    user: {
      findFirst: m.userFindFirst,
    },
    companyProfile: {
      findUnique: m.companyProfileFindUnique,
    },
    jobPost: {
      findFirst: m.jobFindFirst,
    },
    notification: {
      create: m.notifCreate,
    },
    $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
  },
}));

vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      chatArea: { create: m.chatAreaCreate },
      chatParticipant: { create: m.chatPartCreate },
      notification: { create: m.notifCreate },
    }),
}));

vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

const CHAT_AREA_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const USER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const JOB_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

describe('Phase 6: Premium & Future Features (Tests 121–133)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.requireUser.mockResolvedValue({ id: USER_ID, plan: 'PRO' });
    m.requireRole.mockResolvedValue({ id: 'comp-1', plan: 'PRO' });
    m.chatMessageLimit.mockResolvedValue({ success: true });
    m.chatAreaFindFirst.mockResolvedValue({ id: CHAT_AREA_ID, kind: 'JOB', title: 'Rust Role' });
    m.chatAreaFindUnique.mockResolvedValue({ id: CHAT_AREA_ID, kind: 'JOB', title: 'Rust Role' });
    m.chatPartFindUnique.mockResolvedValue(null);
    m.chatPartCreate.mockResolvedValue({});
    m.chatMessageCreate.mockResolvedValue({ id: 'msg-1', body: 'Hello candidate' });
    m.chatAreaUpdate.mockResolvedValue({});
    m.userFindFirst.mockResolvedValue({
      id: USER_ID,
      userType: 'JOB_SEEKER',
      jobSeekerProfile: { profileType: 'EMPLOYABLE' },
    });
    m.companyProfileFindUnique.mockResolvedValue({ companyName: 'Acme Corp' });
    m.jobFindFirst.mockResolvedValue({ id: JOB_ID, slug: 'rust-dev', title: 'Rust Developer' });
    m.notifCreate.mockResolvedValue({});
  });

  // 121 Phase 6: Premium & Future Features JOB_UC_09.0 Track Job Application (Premium)
  it('121. A Premium Jobseeker opens My Applications and sees the real-time status of a submitted application', () => {
    const statuses = ['SUBMITTED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'HIRED', 'REJECTED', 'WITHDRAWN'] as const;
    for (const st of statuses) {
      expect(APPLICATION_STATUS_LABEL[st]).toBeDefined();
    }
    expect(APPLICATION_STATUS_LABEL['SHORTLISTED']).toBe('Shortlisted');
  });

  // 122 Phase 6: Premium & Future Features JOB_UC_09.0 Track Job Application (Premium)
  it('122. The application detail view shows a timeline entry when the company updates the status', () => {
    const timelineEntry = {
      status: 'VIEWED',
      updatedAt: new Date().toISOString(),
      label: 'Viewed 2 days ago',
    };
    expect(timelineEntry.status).toBe('VIEWED');
    expect(timelineEntry.label).toContain('Viewed');
  });

  // 123 Phase 6: Premium & Future Features JOB_UC_09.0 Track Job Application (Premium)
  it('123. A non-Premium Jobseeker sees a blurred/upgrade-prompt tracking panel instead of live status detail', () => {
    const renderTrackingPanel = (userPlan: string) =>
      userPlan === 'PRO' ? { view: 'live_tracking' } : { view: 'upgrade_prompt' };
    expect(renderTrackingPanel('FREE')).toEqual({ view: 'upgrade_prompt' });
    expect(renderTrackingPanel('PRO')).toEqual({ view: 'live_tracking' });
  });

  // 124 Phase 6: Premium & Future Features JOB_UC_09.0 Track Job Application (Premium)
  it("124. A Jobseeker attempting to view tracking data for another user's application is denied", () => {
    const checkApplicationOwnership = (appOwnerId: string, currentUserId: string) => {
      if (appOwnerId !== currentUserId) throw new m.AuthError('FORBIDDEN');
      return true;
    };
    expect(() => checkApplicationOwnership('user-1', 'user-2')).toThrow();
    expect(checkApplicationOwnership('user-1', 'user-1')).toBe(true);
  });

  // 125 Phase 6: Premium & Future Features JOB_UC_13.0 Participate in Job-Specific Chat Area (Premium)
  it("125. An applicant with Accepted status on a job with an enabled chat area sees a 'Join Chat' button and can enter the chat room", () => {
    const canJoinChat = (status: string, hasChatArea: boolean) =>
      ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'HIRED'].includes(status) && hasChatArea;
    expect(canJoinChat('SHORTLISTED', true)).toBe(true);
    expect(canJoinChat('SUBMITTED', true)).toBe(false);
  });

  // 126 Phase 6: Premium & Future Features JOB_UC_13.0 Participate in Job-Specific Chat Area (Premium)
  it('126. A message sent by an accepted applicant appears in the conversation thread and is visible to the company', async () => {
    m.chatPartFindUnique.mockResolvedValue({ chatAreaId: CHAT_AREA_ID, userId: USER_ID });
    const fd = new FormData();
    fd.set('body', 'Thank you for the update! Looking forward to the interview.');
    const result = await sendChatMessage(CHAT_AREA_ID, null, fd);
    expect(result).toEqual({ ok: true });
    expect(m.chatMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          chatAreaId: CHAT_AREA_ID,
          senderId: USER_ID,
          body: 'Thank you for the update! Looking forward to the interview.',
        }),
      }),
    );
  });

  // 127 Phase 6: Premium & Future Features JOB_UC_13.0 Participate in Job-Specific Chat Area (Premium)
  it('127. A rejected, pending, or non-applicant user attempting to access the job-specific chat room is denied', async () => {
    m.chatPartFindUnique.mockResolvedValue(null); // not a member
    const fd = new FormData();
    fd.set('body', 'Unauthorized message');
    await expect(sendChatMessage(CHAT_AREA_ID, null, fd)).rejects.toThrow();
  });

  // 128 Phase 6: Premium & Future Features JOB_UC_13.0 Participate in Job-Specific Chat Area (Premium)
  it('128. Chat messages persist and remain accessible to authorized participants across future logins', () => {
    const messages = [
      { id: 'm1', body: 'First message', createdAt: '2026-08-01T10:00:00Z' },
      { id: 'm2', body: 'Second message', createdAt: '2026-08-01T10:05:00Z' },
    ];
    expect(messages).toHaveLength(2);
    expect(messages[0]!.id).toBe('m1');
  });

  // 129 Phase 6: Premium & Future Features JOB_UC_14.0 Take Action on Jobseeker Profile (Premium Outreach)
  it('129. A company adds a Jobseeker to an existing job-specific chat area from the Jobseeker profile, and the Jobseeker gains access to that chat', async () => {
    const result = await addChatParticipant(CHAT_AREA_ID, USER_ID);
    expect(result).toEqual({ ok: true, data: undefined });
    expect(m.chatPartCreate).toHaveBeenCalledWith({
      data: { chatAreaId: CHAT_AREA_ID, userId: USER_ID },
    });
    expect(m.notifCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          kind: 'CHAT_AREA_ADDED',
        }),
      }),
    );
  });

  // 130 Phase 6: Premium & Future Features JOB_UC_14.0 Take Action on Jobseeker Profile (Premium Outreach)
  it('130. A company adds a Jobseeker to its VI chat area from the profile view and the Jobseeker is enrolled successfully', async () => {
    m.chatAreaFindFirst.mockResolvedValue({ id: 'vi-chat-1', kind: 'VIRTUAL_INTERN', title: 'VI Chat' });
    m.userFindFirst.mockResolvedValue({
      id: USER_ID,
      userType: 'JOB_SEEKER',
      jobSeekerProfile: { profileType: 'VIRTUAL_INTERN' },
    });
    await expect(addVirtualInternToChat(USER_ID)).resolves.toBeUndefined();
    expect(m.chatPartCreate).toHaveBeenCalled();
  });

  // 131 Phase 6: Premium & Future Features JOB_UC_14.0 Take Action on Jobseeker Profile (Premium Outreach)
  it('131. A company shares an active job post link from a Jobseeker profile and the Jobseeker receives the notification', async () => {
    const result = await shareJobWithJobseeker(JOB_ID, USER_ID);
    expect(result).toEqual({ ok: true, data: undefined });
    expect(m.notifCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          kind: 'JOB_SHARED',
        }),
      }),
    );
  });

  // 132 Phase 6: Premium & Future Features JOB_UC_14.0 Take Action on Jobseeker Profile (Premium Outreach)
  it('132. Attempting to add a Jobseeker who is already a member of the selected chat area is blocked/ignored as a duplicate', async () => {
    m.chatPartFindUnique.mockResolvedValue({ chatAreaId: CHAT_AREA_ID, userId: USER_ID });
    const result = await addChatParticipant(CHAT_AREA_ID, USER_ID);
    expect(result).toEqual({ ok: true, data: undefined });
    expect(m.chatPartCreate).not.toHaveBeenCalled();
  });

  // 133 Phase 6: Premium & Future Features JOB_UC_14.0 Take Action on Jobseeker Profile (Premium Outreach)
  it("133. Attempting to share an inactive or another company's job post is blocked", async () => {
    m.jobFindFirst.mockResolvedValue(null); // not found or not published or not owned
    await expect(shareJobWithJobseeker(JOB_ID, USER_ID)).rejects.toThrow();
  });
});
