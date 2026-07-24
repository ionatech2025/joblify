// Nightly retention sweep.
//
// Schedule: daily 02:00 UTC.
// Operations:
//   1. Hard-delete users soft-deleted >30d ago (GDPR Art. 17 follow-through).
//      Their AuditEvent rows are kept with actorId nulled (legal retention).
//   2. Purge JobView rows >13 months old (analytics window).
//   3. Purge expired Invitations >90d past their expiresAt.
//   4. Purge read notifications >6 months old; unread >90 days.
//   5. Delete GDPR export blobs >24h old (exports/ prefix) — enforces the
//      expiry promised in the export email.
//
// Each step is idempotent, so a partial failure can re-run safely.

import { db } from '@/lib/db';
import { del, list } from '@vercel/blob';
import { logger } from '@/lib/observability/logger';

const ONE_DAY_MS = 86_400_000;

// GDPR export links are emailed with a "expires in 24 hours" promise; this is
// that promise.
export const EXPORT_TTL_MS = ONE_DAY_MS;

type ExportBlob = { url: string; uploadedAt: string | Date };

// Pure selection logic (unit-tested): which export blobs are past TTL.
export function expiredExportUrls(blobs: ExportBlob[], now: number): string[] {
  const cutoff = now - EXPORT_TTL_MS;
  return blobs
    .filter((blob) => new Date(blob.uploadedAt).getTime() < cutoff)
    .map((blob) => blob.url);
}

async function purgeExpiredExports(now: number): Promise<number> {
  let purged = 0;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: 'exports/', cursor, limit: 1000 });
    const stale = expiredExportUrls(page.blobs, now);
    if (stale.length > 0) {
      await del(stale);
      purged += stale.length;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return purged;
}

export type RetentionSummary = {
  hardDeletedUsers: number;
  purgedJobViews: number;
  purgedInvitations: number;
  purgedNotifications: number;
  purgedExportBlobs: number;
};

export async function runRetention(): Promise<RetentionSummary> {
  const now = Date.now();

  // 1. Hard-delete users
  const deletedUsers = await db.user.deleteMany({
    where: { deletedAt: { lt: new Date(now - 30 * ONE_DAY_MS) } },
  });

  // 2. Purge job views
  const purgedJobViews = await db.jobView.deleteMany({
    where: { createdAt: { lt: new Date(now - 390 * ONE_DAY_MS) } },
  });

  // 3. Purge expired invitations
  const purgedInvitations = await db.invitation.deleteMany({
    where: { expiresAt: { lt: new Date(now - 90 * ONE_DAY_MS) } },
  });

  // 4. Purge stale notifications
  const purgedReadNotifications = await db.notification.deleteMany({
    where: {
      readAt: { not: null, lt: new Date(now - 180 * ONE_DAY_MS) },
    },
  });
  const purgedUnreadNotifications = await db.notification.deleteMany({
    where: { readAt: null, createdAt: { lt: new Date(now - 90 * ONE_DAY_MS) } },
  });

  // 5. Enforce the 24h expiry promised on GDPR export links. Best-effort:
  // a blob-store error must not sink the DB purges above.
  let purgedExportBlobs = 0;
  try {
    purgedExportBlobs = await purgeExpiredExports(now);
  } catch (err) {
    logger.error({ err }, 'export-blob purge failed (will retry next run)');
  }

  const summary = {
    hardDeletedUsers: deletedUsers.count,
    purgedJobViews: purgedJobViews.count,
    purgedInvitations: purgedInvitations.count,
    purgedNotifications: purgedReadNotifications.count + purgedUnreadNotifications.count,
    purgedExportBlobs,
  };

  logger.info(summary, 'retention sweep complete');
  return summary;
}
