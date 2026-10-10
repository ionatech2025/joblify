// Nightly retention sweep.
//
// Schedule: daily 02:00 UTC.
// Operations:
//   1. Hard-delete users soft-deleted >30d ago (GDPR Art. 17 follow-through).
//      Their stored FILES (résumés, generated CVs, company logo) are removed
//      from Blob first — the cascade removes the database rows, and a file with
//      no row pointing at it is a personal document nobody can ever delete. A
//      user whose files could not be removed is left for the next run.
//      Their AuditEvent rows are kept with actorId nulled (legal retention).
//   2. Purge JobView rows >13 months old (analytics window).
//   3. Purge expired Invitations >90d past their expiresAt.
//   4. Purge read notifications >6 months old; unread >90 days.
//   5. Remove résumés the owner deleted >30d ago that no application
//      references any more (file + row).
//   6. AuditEvent: strip IP address / user agent after 90 days, delete the
//      event itself after 1 year — what the privacy policy states.
//   7. Delete LEGACY GDPR export blobs >24h old (exports/ prefix). Exports are
//      no longer written to storage (they are streamed to the signed-in
//      requester), so this only drains links created before that change.
//
// Each step is idempotent, so a partial failure can re-run safely.

import { db } from '@/lib/db';
import { del, list } from '@vercel/blob';
import { deleteStored, storeToken } from '@/lib/storage/blob';
import { logger } from '@/lib/observability/logger';

const ONE_DAY_MS = 86_400_000;

// GDPR export links used to be emailed with an "expires in 24 hours" promise;
// this drains any that predate the change to streamed downloads.
export const EXPORT_TTL_MS = ONE_DAY_MS;

export const AUDIT_SCRUB_AFTER_DAYS = 90;
export const AUDIT_DELETE_AFTER_DAYS = 365;
export const RESUME_GRACE_DAYS = 30;

const USER_BATCH = 200;
const MAX_USER_BATCHES = 10;

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
    const page = await list({
      prefix: 'exports/',
      cursor,
      limit: 1000,
      token: storeToken('private'),
    });
    const stale = expiredExportUrls(page.blobs, now);
    if (stale.length > 0) {
      await del(stale, { token: storeToken('private') });
      purged += stale.length;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return purged;
}

async function hardDeleteExpiredUsers(
  now: number,
): Promise<{ users: number; files: number; deferred: number }> {
  const cutoff = new Date(now - 30 * ONE_DAY_MS);
  let users = 0;
  let files = 0;
  let deferred = 0;

  for (let batch = 0; batch < MAX_USER_BATCHES; batch++) {
    const rows = await db.user.findMany({
      where: { deletedAt: { lt: cutoff } },
      select: {
        id: true,
        resumes: { select: { fileBlobUrl: true } },
        companyProfile: { select: { logoUrl: true } },
      },
      take: USER_BATCH,
    });
    if (rows.length === 0) break;

    const deletable: string[] = [];
    for (const row of rows) {
      let failed = false;
      const outcomes = [
        ...row.resumes.map((r) => deleteStored(r.fileBlobUrl, 'private')),
        ...(row.companyProfile?.logoUrl
          ? [deleteStored(row.companyProfile.logoUrl, 'public')]
          : []),
      ];
      for (const outcome of await Promise.all(outcomes)) {
        if (outcome === 'deleted') files++;
        if (outcome === 'failed') failed = true;
      }
      if (failed) deferred++;
      else deletable.push(row.id);
    }

    if (deletable.length === 0) break; // everything left is waiting on the store; try tomorrow
    const result = await db.user.deleteMany({ where: { id: { in: deletable } } });
    users += result.count;
    if (rows.length < USER_BATCH) break;
  }

  return { users, files, deferred };
}

async function purgeOrphanedResumes(now: number): Promise<number> {
  const cutoff = new Date(now - RESUME_GRACE_DAYS * ONE_DAY_MS);
  const rows = await db.resume.findMany({
    // Owner-deleted, past the grace period, and no application still points at
    // it (JobApplication.resumeId is RESTRICT, so those could not go anyway).
    where: { deletedAt: { lt: cutoff }, applications: { none: {} } },
    select: { id: true, fileBlobUrl: true },
    take: 500,
  });
  const deletable: string[] = [];
  for (const row of rows) {
    if ((await deleteStored(row.fileBlobUrl, 'private')) !== 'failed') deletable.push(row.id);
  }
  if (deletable.length === 0) return 0;
  const result = await db.resume.deleteMany({ where: { id: { in: deletable } } });
  return result.count;
}

export type RetentionSummary = {
  hardDeletedUsers: number;
  deletedUserFiles: number;
  deferredUsers: number;
  purgedJobViews: number;
  purgedInvitations: number;
  purgedNotifications: number;
  purgedResumes: number;
  scrubbedAuditEvents: number;
  purgedAuditEvents: number;
  purgedExportBlobs: number;
};

export async function runRetention(): Promise<RetentionSummary> {
  const now = Date.now();

  // 1. Hard-delete users (files first)
  const hardDeleted = await hardDeleteExpiredUsers(now);

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

  // 5. Orphaned résumés. Best-effort: a store error must not sink the DB
  //    purges around it.
  let purgedResumes = 0;
  try {
    purgedResumes = await purgeOrphanedResumes(now);
  } catch (err) {
    logger.error({ err }, 'orphaned resume purge failed (will retry next run)');
  }

  // 6. Audit log: scrub identifiers early, delete the event on schedule.
  const scrubbed = await db.auditEvent.updateMany({
    where: {
      createdAt: { lt: new Date(now - AUDIT_SCRUB_AFTER_DAYS * ONE_DAY_MS) },
      OR: [{ ip: { not: null } }, { ua: { not: null } }],
    },
    data: { ip: null, ua: null },
  });
  const purgedAudit = await db.auditEvent.deleteMany({
    where: { createdAt: { lt: new Date(now - AUDIT_DELETE_AFTER_DAYS * ONE_DAY_MS) } },
  });

  // 7. Legacy export blobs. Best-effort, same reasoning as above.
  let purgedExportBlobs = 0;
  try {
    purgedExportBlobs = await purgeExpiredExports(now);
  } catch (err) {
    logger.error({ err }, 'export-blob purge failed (will retry next run)');
  }

  const summary: RetentionSummary = {
    hardDeletedUsers: hardDeleted.users,
    deletedUserFiles: hardDeleted.files,
    deferredUsers: hardDeleted.deferred,
    purgedJobViews: purgedJobViews.count,
    purgedInvitations: purgedInvitations.count,
    purgedNotifications: purgedReadNotifications.count + purgedUnreadNotifications.count,
    purgedResumes,
    scrubbedAuditEvents: scrubbed.count,
    purgedAuditEvents: purgedAudit.count,
    purgedExportBlobs,
  };

  logger.info(summary, 'retention sweep complete');
  return summary;
}
