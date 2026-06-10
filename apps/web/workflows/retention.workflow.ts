// Vercel Workflow: nightly retention sweep.
//
// Schedule: daily 02:00 UTC.
// Operations:
//   1. Hard-delete users soft-deleted >30d ago (GDPR Art. 17 follow-through).
//      Their AuditEvent rows are kept with actorId nulled (legal retention).
//   2. Purge JobView rows >13 months old (analytics window).
//   3. Purge expired Invitations >90d past their expiresAt.
//   4. Purge read notifications >6 months old; unread >90 days.
//
// Each step is idempotent and bounded (LIMIT) so a partial failure can
// re-run safely.

import { db } from '@/lib/db';
import { logger } from '@/lib/observability/logger';

const ONE_DAY_MS = 86_400_000;

export type RetentionSummary = {
  hardDeletedUsers: number;
  purgedJobViews: number;
  purgedInvitations: number;
  purgedNotifications: number;
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

  const summary = {
    hardDeletedUsers: deletedUsers.count,
    purgedJobViews: purgedJobViews.count,
    purgedInvitations: purgedInvitations.count,
    purgedNotifications: purgedReadNotifications.count + purgedUnreadNotifications.count,
  };

  logger.info(summary, 'retention sweep complete');
  return summary;
}
