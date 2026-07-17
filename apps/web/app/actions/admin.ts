'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { logger } from '@/lib/observability/logger';

// Trust & safety: an ADMIN reviews a company's self-submitted profile and
// either verifies it (unlocks full visibility — see JOB_UC_06.0's "unverified
// companies do not appear in the list") or rejects it, with a reason the
// company can see. This is the first real admin action in the app; the
// ADMIN role and /admin route already existed in middleware/schema but had
// no page or capability behind them.
export async function verifyCompany(
  companyProfileId: string,
  status: 'VERIFIED' | 'REJECTED',
  reason?: string,
): Promise<void> {
  const admin = await requireRole('ADMIN');

  const profile = await db.companyProfile.findUnique({
    where: { id: companyProfileId },
    select: { id: true, userId: true, companyName: true, verificationStatus: true },
  });
  if (!profile) throw new Error('Company not found.');

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  await withAudit(
    { actorId: admin.id, ip, ua },
    {
      action: 'COMPANY_PROFILE_UPDATED',
      entity: 'company_profile',
      entityId: profile.id,
      before: { verificationStatus: profile.verificationStatus },
      after: () => ({ verificationStatus: status, reason: reason ?? null }),
    },
    async (tx) => {
      await tx.companyProfile.update({
        where: { id: profile.id },
        data: { verificationStatus: status },
      });
      await tx.notification.create({
        data: {
          userId: profile.userId,
          kind: 'ACCOUNT_UPDATE',
          payload: {
            message:
              status === 'VERIFIED'
                ? `${profile.companyName} is now verified and visible to jobseekers.`
                : `${profile.companyName} was not verified.${reason ? ` Reason: ${reason}` : ''}`,
            verificationStatus: status,
          },
        },
      });
    },
  );

  updateTag(tags.company(profile.userId));
  updateTag(tags.companies());
  updateTag(tags.notifications(profile.userId));

  logger.info({ companyProfileId: profile.id, adminId: admin.id, status }, 'company verification status changed');
}
