import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  user: vi.fn(),
  jobView: vi.fn(),
  invitation: vi.fn(),
  notification: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: { deleteMany: m.user },
    jobView: { deleteMany: m.jobView },
    invitation: { deleteMany: m.invitation },
    notification: { deleteMany: m.notification },
  },
}));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn() } }));

import { runRetention } from '@/workflows/retention.workflow';

const DAY = 86_400_000;

describe('runRetention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.user.mockResolvedValue({ count: 2 });
    m.jobView.mockResolvedValue({ count: 5 });
    m.invitation.mockResolvedValue({ count: 1 });
    m.notification.mockResolvedValue({ count: 3 }); // called twice: read + unread
  });

  it('summarizes purge counts, summing read + unread notifications', async () => {
    const s = await runRetention();
    expect(s).toEqual({ hardDeletedUsers: 2, purgedJobViews: 5, purgedInvitations: 1, purgedNotifications: 6 });
    expect(m.notification).toHaveBeenCalledTimes(2);
  });

  it('hard-deletes only users soft-deleted more than ~30 days ago', async () => {
    await runRetention();
    const { lt } = m.user.mock.calls[0]![0].where.deletedAt;
    expect(lt).toBeInstanceOf(Date);
    const daysAgo = (Date.now() - lt.getTime()) / DAY;
    expect(daysAgo).toBeGreaterThan(29);
    expect(daysAgo).toBeLessThan(31);
  });

  it('purges job views beyond the ~13-month analytics window', async () => {
    await runRetention();
    const { lt } = m.jobView.mock.calls[0]![0].where.createdAt;
    expect((Date.now() - lt.getTime()) / DAY).toBeGreaterThan(389);
  });
});
