'use server';

import { headers } from 'next/headers';
import { clerkClient } from '@clerk/nextjs/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { deleteJob } from '@/lib/search/algolia';
import { logger } from '@/lib/observability/logger';
import { redirect } from 'next/navigation';

export async function deleteMyAccount(confirmation: string): Promise<void> {
  const user = await requireUser();
  if (confirmation !== user.email) throw new Error('Confirmation does not match your email.');

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  await withAudit(
    { actorId: user.id, ip, ua },
    { action: 'USER_DELETED', entity: 'user', entityId: user.id },
    async (tx) => {
      // Soft delete now; retention workflow hard-deletes after 30 days.
      await tx.user.update({
        where: { id: user.id },
        data: { deletedAt: new Date() },
      });
    },
  );

  logger.info({ userId: user.id }, 'account scheduled for deletion');

  // Best-effort external cleanup — never block deletion on a vendor call.
  // Deleting the Clerk user revokes all of its sessions immediately.
  try {
    if (user.clerkUserId) {
      await (await clerkClient()).users.deleteUser(user.clerkUserId);
    }
  } catch (err) {
    logger.warn({ err, userId: user.id }, 'clerk user delete failed (post account-delete)');
  }

  // Deindex anything this user owns from Algolia. Companies own job posts;
  // jobseekers have nothing in the search index in V1.
  if (user.userType === 'COMPANY') {
    try {
      const jobs = await db.jobPost.findMany({
        where: { companyId: user.id },
        select: { id: true },
      });
      await Promise.allSettled(jobs.map((j) => deleteJob(j.id)));
    } catch (err) {
      logger.warn({ err, userId: user.id }, 'algolia deindex failed (post account-delete)');
    }
  }

  redirect('/sign-out?reason=deleted');
}
