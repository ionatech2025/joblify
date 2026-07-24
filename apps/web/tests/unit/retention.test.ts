import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  user: vi.fn(),
  jobView: vi.fn(),
  invitation: vi.fn(),
  notification: vi.fn(),
  blobList: vi.fn(),
  blobDel: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: { deleteMany: m.user },
    jobView: { deleteMany: m.jobView },
    invitation: { deleteMany: m.invitation },
    notification: { deleteMany: m.notification },
  },
}));
vi.mock('@vercel/blob', () => ({ list: m.blobList, del: m.blobDel }));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));

import { runRetention, expiredExportUrls, EXPORT_TTL_MS } from '@/workflows/retention.workflow';

const DAY = 86_400_000;

describe('runRetention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.user.mockResolvedValue({ count: 2 });
    m.jobView.mockResolvedValue({ count: 5 });
    m.invitation.mockResolvedValue({ count: 1 });
    m.notification.mockResolvedValue({ count: 3 }); // called twice: read + unread
    m.blobList.mockResolvedValue({ blobs: [], cursor: undefined, hasMore: false });
    m.blobDel.mockResolvedValue(undefined);
  });

  it('summarizes purge counts, summing read + unread notifications', async () => {
    const s = await runRetention();
    expect(s).toEqual({
      hardDeletedUsers: 2,
      purgedJobViews: 5,
      purgedInvitations: 1,
      purgedNotifications: 6,
      purgedExportBlobs: 0,
    });
    expect(m.notification).toHaveBeenCalledTimes(2);
  });

  it('selects only export blobs older than the 24h TTL', () => {
    const now = Date.now();
    const stale = { url: 'https://blob/exports/a.json', uploadedAt: new Date(now - EXPORT_TTL_MS - 60_000) };
    const fresh = { url: 'https://blob/exports/b.json', uploadedAt: new Date(now - EXPORT_TTL_MS + 60_000) };
    expect(expiredExportUrls([stale, fresh], now)).toEqual([stale.url]);
  });

  it('deletes expired export blobs and reports the count', async () => {
    const now = Date.now();
    m.blobList.mockResolvedValue({
      blobs: [
        { url: 'https://blob/exports/old.json', uploadedAt: new Date(now - 2 * EXPORT_TTL_MS) },
        { url: 'https://blob/exports/new.json', uploadedAt: new Date(now) },
      ],
      cursor: undefined,
      hasMore: false,
    });
    const s = await runRetention();
    expect(m.blobList).toHaveBeenCalledWith(expect.objectContaining({ prefix: 'exports/' }));
    expect(m.blobDel).toHaveBeenCalledWith(['https://blob/exports/old.json']);
    expect(s.purgedExportBlobs).toBe(1);
  });

  it('keeps the DB purge summary when the blob store errors', async () => {
    m.blobList.mockRejectedValue(new Error('blob unavailable'));
    const s = await runRetention();
    expect(s.hardDeletedUsers).toBe(2);
    expect(s.purgedExportBlobs).toBe(0);
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
