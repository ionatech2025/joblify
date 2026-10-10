import { vi, describe, it, expect, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  userFindMany: vi.fn(),
  userDeleteMany: vi.fn(),
  jobView: vi.fn(),
  invitation: vi.fn(),
  notification: vi.fn(),
  resumeFindMany: vi.fn(),
  resumeDeleteMany: vi.fn(),
  auditUpdateMany: vi.fn(),
  auditDeleteMany: vi.fn(),
  blobList: vi.fn(),
  blobDel: vi.fn(),
  deleteStored: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: { findMany: m.userFindMany, deleteMany: m.userDeleteMany },
    jobView: { deleteMany: m.jobView },
    invitation: { deleteMany: m.invitation },
    notification: { deleteMany: m.notification },
    resume: { findMany: m.resumeFindMany, deleteMany: m.resumeDeleteMany },
    auditEvent: { updateMany: m.auditUpdateMany, deleteMany: m.auditDeleteMany },
  },
}));
vi.mock('@vercel/blob', () => ({ list: m.blobList, del: m.blobDel }));
vi.mock('@/lib/storage/blob', () => ({
  deleteStored: m.deleteStored,
  storeToken: () => 'tok',
}));
vi.mock('@/lib/observability/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));

import {
  runRetention,
  expiredExportUrls,
  EXPORT_TTL_MS,
  AUDIT_SCRUB_AFTER_DAYS,
  AUDIT_DELETE_AFTER_DAYS,
} from '@/workflows/retention.workflow';

const DAY = 86_400_000;
const daysAgo = (d: Date) => (Date.now() - d.getTime()) / DAY;

describe('runRetention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.userFindMany.mockResolvedValue([]);
    m.userDeleteMany.mockResolvedValue({ count: 0 });
    m.jobView.mockResolvedValue({ count: 5 });
    m.invitation.mockResolvedValue({ count: 1 });
    m.notification.mockResolvedValue({ count: 3 }); // called twice: read + unread
    m.resumeFindMany.mockResolvedValue([]);
    m.resumeDeleteMany.mockResolvedValue({ count: 0 });
    m.auditUpdateMany.mockResolvedValue({ count: 7 });
    m.auditDeleteMany.mockResolvedValue({ count: 2 });
    m.deleteStored.mockResolvedValue('deleted');
    m.blobList.mockResolvedValue({ blobs: [], cursor: undefined, hasMore: false });
    m.blobDel.mockResolvedValue(undefined);
  });

  it('summarizes purge counts, summing read + unread notifications', async () => {
    const s = await runRetention();
    expect(s).toEqual({
      hardDeletedUsers: 0,
      deletedUserFiles: 0,
      deferredUsers: 0,
      purgedJobViews: 5,
      purgedInvitations: 1,
      purgedNotifications: 6,
      purgedResumes: 0,
      scrubbedAuditEvents: 7,
      purgedAuditEvents: 2,
      purgedExportBlobs: 0,
    });
    expect(m.notification).toHaveBeenCalledTimes(2);
  });

  it('selects only export blobs older than the 24h TTL', () => {
    const now = Date.now();
    const stale = {
      url: 'https://blob/exports/a.json',
      uploadedAt: new Date(now - EXPORT_TTL_MS - 60_000),
    };
    const fresh = {
      url: 'https://blob/exports/b.json',
      uploadedAt: new Date(now - EXPORT_TTL_MS + 60_000),
    };
    expect(expiredExportUrls([stale, fresh], now)).toEqual([stale.url]);
  });

  it('drains legacy export blobs and reports the count', async () => {
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
    expect(m.blobDel).toHaveBeenCalledWith(['https://blob/exports/old.json'], { token: 'tok' });
    expect(s.purgedExportBlobs).toBe(1);
  });

  it('keeps the DB purge summary when the blob store errors', async () => {
    m.blobList.mockRejectedValue(new Error('blob unavailable'));
    const s = await runRetention();
    expect(s.purgedJobViews).toBe(5);
    expect(s.purgedExportBlobs).toBe(0);
  });

  it('purges job views beyond the ~13-month analytics window', async () => {
    await runRetention();
    const { lt } = m.jobView.mock.calls[0]![0].where.createdAt;
    expect(daysAgo(lt)).toBeGreaterThan(389);
  });

  describe('account erasure', () => {
    const user = (id: string, resumes: string[], logo: string | null = null) => ({
      id,
      resumes: resumes.map((fileBlobUrl) => ({ fileBlobUrl })),
      companyProfile: logo ? { logoUrl: logo } : null,
    });

    it('selects only users soft-deleted more than ~30 days ago', async () => {
      await runRetention();
      const { lt } = m.userFindMany.mock.calls[0]![0].where.deletedAt;
      expect(lt).toBeInstanceOf(Date);
      expect(daysAgo(lt)).toBeGreaterThan(29);
      expect(daysAgo(lt)).toBeLessThan(31);
    });

    it('removes the user’s stored files BEFORE deleting the user row', async () => {
      const order: string[] = [];
      m.userFindMany
        .mockResolvedValueOnce([
          user('u1', ['https://s.private.blob.vercel-storage.com/resumes/u1/a.pdf']),
          user('u2', [], 'https://p.public.blob.vercel-storage.com/logos/u2/l.png'),
        ])
        .mockResolvedValue([]);
      m.deleteStored.mockImplementation(async (_url: string, kind: string) => {
        order.push(`file:${kind}`);
        return 'deleted';
      });
      m.userDeleteMany.mockImplementation(async () => {
        order.push('rows');
        return { count: 2 };
      });

      const s = await runRetention();
      expect(order).toEqual(['file:private', 'file:public', 'rows']);
      expect(m.userDeleteMany).toHaveBeenCalledWith({ where: { id: { in: ['u1', 'u2'] } } });
      expect(s).toMatchObject({ hardDeletedUsers: 2, deletedUserFiles: 2, deferredUsers: 0 });
    });

    it('leaves a user in place (for tomorrow) when one of their files could not be removed', async () => {
      m.userFindMany
        .mockResolvedValueOnce([
          user('ok', ['https://s.private.blob.vercel-storage.com/resumes/ok/a.pdf']),
          user('stuck', ['https://s.private.blob.vercel-storage.com/resumes/stuck/a.pdf']),
        ])
        .mockResolvedValue([]);
      m.deleteStored.mockImplementation(async (url: string) =>
        url.includes('/stuck/') ? 'failed' : 'deleted',
      );
      m.userDeleteMany.mockResolvedValue({ count: 1 });

      const s = await runRetention();
      // Deleting the row would orphan a personal document no one can ever erase.
      expect(m.userDeleteMany).toHaveBeenCalledWith({ where: { id: { in: ['ok'] } } });
      expect(s).toMatchObject({ hardDeletedUsers: 1, deferredUsers: 1 });
    });
  });

  describe('résumé and audit-log retention', () => {
    it('erases owner-deleted résumés that no application references (file, then row)', async () => {
      m.resumeFindMany.mockResolvedValue([
        { id: 'r1', fileBlobUrl: 'https://s.private.blob.vercel-storage.com/resumes/u/r1.pdf' },
      ]);
      m.resumeDeleteMany.mockResolvedValue({ count: 1 });
      const s = await runRetention();
      const where = m.resumeFindMany.mock.calls[0]![0].where;
      expect(where.applications).toEqual({ none: {} });
      expect(daysAgo(where.deletedAt.lt)).toBeGreaterThan(29);
      expect(m.deleteStored).toHaveBeenCalledWith(
        'https://s.private.blob.vercel-storage.com/resumes/u/r1.pdf',
        'private',
      );
      expect(s.purgedResumes).toBe(1);
    });

    it('strips IP / user agent from audit events after 90 days and deletes them after a year', async () => {
      const s = await runRetention();
      const scrub = m.auditUpdateMany.mock.calls[0]![0];
      expect(daysAgo(scrub.where.createdAt.lt)).toBeGreaterThan(AUDIT_SCRUB_AFTER_DAYS - 1);
      expect(scrub.data).toEqual({ ip: null, ua: null });
      const del = m.auditDeleteMany.mock.calls[0]![0];
      expect(daysAgo(del.where.createdAt.lt)).toBeGreaterThan(AUDIT_DELETE_AFTER_DAYS - 1);
      expect(s).toMatchObject({ scrubbedAuditEvents: 7, purgedAuditEvents: 2 });
    });
  });
});
