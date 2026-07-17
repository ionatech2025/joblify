import { vi, describe, it, expect, beforeEach } from 'vitest';

// Chat areas (JOB_UC_11-14 / flowchart chat flows): companies open a
// job-specific or virtual-intern chat area, add seekers, and everyone in an
// area can post messages. openJobChatArea / openVirtualInternChatArea redirect
// into the area on success.

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
    requireUser: vi.fn(),
    chatMessageLimit: vi.fn(),
    jobFindFirst: vi.fn(),
    areaFindUnique: vi.fn(),
    areaFindFirst: vi.fn(),
    companyFindUnique: vi.fn(),
    userFindFirst: vi.fn(),
    partFindUnique: vi.fn(),
    msgCreate: vi.fn(),
    areaUpdate: vi.fn(),
    transaction: vi.fn(),
    areaCreate: vi.fn(),
    partCreate: vi.fn(),
    notifCreate: vi.fn(),
    updateTag: vi.fn(),
    redirect: vi.fn((url: string) => {
      throw new RedirectError(url);
    }),
  };
});

vi.mock('@/lib/auth', () => ({
  requireRole: m.requireRole,
  requireUser: m.requireUser,
  AuthError: m.AuthError,
}));
vi.mock('@/lib/ratelimit', () => ({ chatMessageLimit: m.chatMessageLimit }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/db', () => ({
  db: {
    jobPost: { findFirst: m.jobFindFirst },
    chatArea: { findUnique: m.areaFindUnique, findFirst: m.areaFindFirst, update: m.areaUpdate },
    companyProfile: { findUnique: m.companyFindUnique },
    user: { findFirst: m.userFindFirst },
    chatParticipant: { findUnique: m.partFindUnique },
    chatMessage: { create: m.msgCreate },
    $transaction: m.transaction,
  },
}));
vi.mock('@/lib/audit', () => ({
  withAudit: (_ctx: unknown, _meta: unknown, fn: (tx: unknown) => unknown) =>
    fn({
      chatArea: { create: m.areaCreate },
      chatParticipant: { create: m.partCreate },
      notification: { create: m.notifCreate },
    }),
}));
vi.mock('next/cache', () => ({ updateTag: m.updateTag }));
vi.mock('next/headers', () => ({ headers: async () => new Map() }));
vi.mock('next/navigation', () => ({ redirect: m.redirect }));

import {
  openJobChatArea,
  openVirtualInternChatArea,
  addChatParticipant,
  sendChatMessage,
} from '@/app/actions/chat';

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue({ id: 'company1' });
  m.requireUser.mockResolvedValue({ id: 'seeker1' });
  m.chatMessageLimit.mockResolvedValue({ success: true });
  m.jobFindFirst.mockResolvedValue({ id: 'job1', title: 'Engineer' });
  m.areaFindUnique.mockResolvedValue(null);
  m.areaFindFirst.mockResolvedValue(null);
  m.companyFindUnique.mockResolvedValue({ companyName: 'Acme' });
  m.userFindFirst.mockResolvedValue({
    id: 'seeker1',
    jobSeekerProfile: { profileType: 'EMPLOYABLE' },
  });
  m.partFindUnique.mockResolvedValue(null);
  m.areaCreate.mockResolvedValue({ id: 'area1' });
  m.partCreate.mockResolvedValue({});
  m.notifCreate.mockResolvedValue({});
  m.msgCreate.mockReturnValue({ __op: 'msg' });
  m.areaUpdate.mockReturnValue({ __op: 'bump' });
  m.transaction.mockResolvedValue([]);
});

describe('openJobChatArea', () => {
  it('propagates the auth error for non-companies', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(openJobChatArea('job1')).rejects.toThrow();
    expect(m.areaCreate).not.toHaveBeenCalled();
  });

  it("rejects opening a chat area on another company's job", async () => {
    m.jobFindFirst.mockResolvedValue(null);
    await expect(openJobChatArea('job1')).rejects.toThrow();
    expect(m.areaCreate).not.toHaveBeenCalled();
  });

  it('reuses an existing area and redirects into it without creating', async () => {
    m.areaFindUnique.mockResolvedValue({ id: 'area1' });
    await expect(openJobChatArea('job1')).rejects.toThrow('/company/chats/area1');
    expect(m.areaCreate).not.toHaveBeenCalled();
  });

  it('creates the job area (company joined) on first use and redirects in', async () => {
    m.areaCreate.mockResolvedValue({ id: 'area2' });
    await expect(openJobChatArea('job1')).rejects.toThrow('/company/chats/area2');
    const data = m.areaCreate.mock.calls[0]![0].data;
    expect(data.kind).toBe('JOB');
    expect(data.companyId).toBe('company1');
    expect(data.jobPostId).toBe('job1');
    expect(data.title).toBe('Engineer');
    expect(data.participants.create).toEqual({ userId: 'company1' });
  });
});

describe('openVirtualInternChatArea', () => {
  it('reuses the company’s existing VI area', async () => {
    m.areaFindFirst.mockResolvedValue({ id: 'vi1' });
    await expect(openVirtualInternChatArea()).rejects.toThrow('/company/chats/vi1');
    expect(m.areaCreate).not.toHaveBeenCalled();
  });

  it('creates a single VI area titled from the company name', async () => {
    m.areaCreate.mockResolvedValue({ id: 'vi2' });
    await expect(openVirtualInternChatArea()).rejects.toThrow('/company/chats/vi2');
    const data = m.areaCreate.mock.calls[0]![0].data;
    expect(data.kind).toBe('VIRTUAL_INTERN');
    expect(data.title).toContain('Acme');
    expect(data.participants.create).toEqual({ userId: 'company1' });
  });
});

describe('addChatParticipant', () => {
  beforeEach(() => {
    m.areaFindFirst.mockResolvedValue({ id: 'area1', kind: 'JOB', title: 'Engineer' });
  });

  it('propagates the auth error for non-companies', async () => {
    m.requireRole.mockRejectedValue(new m.AuthError('FORBIDDEN'));
    await expect(addChatParticipant('area1', 'seeker1')).rejects.toThrow();
    expect(m.partCreate).not.toHaveBeenCalled();
  });

  it("rejects adding to another company's area (tenancy)", async () => {
    m.areaFindFirst.mockResolvedValue(null);
    await expect(addChatParticipant('area1', 'seeker1')).rejects.toThrow();
    expect(m.partCreate).not.toHaveBeenCalled();
  });

  it('rejects when the target is not a job seeker', async () => {
    m.userFindFirst.mockResolvedValue(null);
    await expect(addChatParticipant('area1', 'seeker1')).rejects.toThrow('Job seeker not found');
    expect(m.partCreate).not.toHaveBeenCalled();
  });

  it('only lets virtual interns into a VI area', async () => {
    m.areaFindFirst.mockResolvedValue({ id: 'vi1', kind: 'VIRTUAL_INTERN', title: 'VI' });
    m.userFindFirst.mockResolvedValue({
      id: 'seeker1',
      jobSeekerProfile: { profileType: 'EMPLOYABLE' },
    });
    await expect(addChatParticipant('vi1', 'seeker1')).rejects.toThrow('virtual-intern');
    expect(m.partCreate).not.toHaveBeenCalled();
  });

  it('is idempotent when the seeker is already a participant', async () => {
    m.partFindUnique.mockResolvedValue({ chatAreaId: 'area1' });
    await addChatParticipant('area1', 'seeker1');
    expect(m.partCreate).not.toHaveBeenCalled();
  });

  it('adds the seeker, notifies them, and invalidates their cache', async () => {
    await addChatParticipant('area1', 'seeker1');
    expect(m.partCreate).toHaveBeenCalledWith({ data: { chatAreaId: 'area1', userId: 'seeker1' } });
    const notif = m.notifCreate.mock.calls[0]![0].data;
    expect(notif.userId).toBe('seeker1');
    expect(notif.kind).toBe('CHAT_AREA_ADDED');
    expect(notif.payload.chatAreaId).toBe('area1');
    expect(m.updateTag).toHaveBeenCalledWith('user:seeker1:notifications');
  });
});

describe('sendChatMessage', () => {
  it('rejects a caller who is not a member of the area', async () => {
    m.partFindUnique.mockResolvedValue(null);
    const fd = new FormData();
    fd.set('body', 'hello');
    await expect(sendChatMessage('area1', fd)).rejects.toThrow();
    expect(m.msgCreate).not.toHaveBeenCalled();
  });

  it('enforces the per-user send-rate limit', async () => {
    m.chatMessageLimit.mockResolvedValue({ success: false });
    const fd = new FormData();
    fd.set('body', 'spam');
    await expect(sendChatMessage('area1', fd)).rejects.toThrow(/too quickly/i);
    expect(m.msgCreate).not.toHaveBeenCalled();
  });

  it('rejects an empty message body', async () => {
    m.partFindUnique.mockResolvedValue({ chatAreaId: 'area1' });
    const fd = new FormData();
    fd.set('body', '   ');
    await expect(sendChatMessage('area1', fd)).rejects.toThrow();
    expect(m.msgCreate).not.toHaveBeenCalled();
  });

  it('posts a TEXT message and bumps the area for recency', async () => {
    m.partFindUnique.mockResolvedValue({ chatAreaId: 'area1' });
    const fd = new FormData();
    fd.set('body', 'Welcome to the team');
    await sendChatMessage('area1', fd);
    const data = m.msgCreate.mock.calls[0]![0].data;
    expect(data).toMatchObject({
      chatAreaId: 'area1',
      senderId: 'seeker1',
      kind: 'TEXT',
      body: 'Welcome to the team',
      attachmentUrl: null,
    });
    expect(m.areaUpdate).toHaveBeenCalledWith({
      where: { id: 'area1' },
      data: { updatedAt: expect.any(Date) },
    });
    expect(m.transaction).toHaveBeenCalledTimes(1);
  });

  it('carries the attachment link on a MATERIAL message', async () => {
    m.partFindUnique.mockResolvedValue({ chatAreaId: 'area1' });
    const fd = new FormData();
    fd.set('body', 'Prep material');
    fd.set('kind', 'MATERIAL');
    fd.set('attachmentUrl', 'https://files.example.com/prep.pdf');
    await sendChatMessage('area1', fd);
    const data = m.msgCreate.mock.calls[0]![0].data;
    expect(data.kind).toBe('MATERIAL');
    expect(data.attachmentUrl).toBe('https://files.example.com/prep.pdf');
  });
});
