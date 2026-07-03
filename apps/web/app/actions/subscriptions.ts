'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { updateTag } from 'next/cache';
import { Prisma, type ProfileType } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';

async function auditCtx(actorId: string) {
  const h = await headers();
  return {
    actorId,
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    ua: h.get('user-agent') ?? null,
  };
}

// Follow a company as EMPLOYABLE or VIRTUAL_INTERN (JOB_UC_07.0). The seeker
// must hold a matching profile first — subscribing is how they appear in the
// company's "interested employees / interested virtual interns" lists — and
// may hold one subscription per type to the same company.
export async function subscribeToCompany(companyUserId: string, profileType: ProfileType): Promise<void> {
  const user = await requireRole('JOB_SEEKER');

  const profile = await db.jobSeekerProfile.findUnique({
    where: { userId: user.id },
    select: { profileType: true },
  });
  // No profile yet → pick a path first (UC_07 step 5: route to profile form).
  if (!profile) redirect('/onboarding');
  // Wrong profile type for this subscription → switch it on the profile page.
  if (profile.profileType !== profileType) redirect('/jobseeker/profile');

  const company = await db.companyProfile.findUnique({
    where: { userId: companyUserId },
    select: { userId: true, companyName: true },
  });
  if (!company) throw new Error('Company not found.');

  const seekerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'A job seeker';

  try {
    await withAudit(
      await auditCtx(user.id),
      {
        action: 'SUBSCRIPTION_CREATED',
        entity: 'company_subscription',
        after: (r) => ({ id: r.id, companyId: company.userId, profileType }),
      },
      async (tx) => {
        const subscription = await tx.companySubscription.create({
          data: {
            companyId: company.userId,
            jobSeekerId: user.id,
            profileType,
          },
          select: { id: true },
        });
        await tx.notification.create({
          data: {
            userId: company.userId,
            kind: 'NEW_SUBSCRIBER',
            payload: {
              jobSeekerId: user.id,
              profileType,
              message: `${seekerName} subscribed to ${company.companyName} as ${profileType === 'VIRTUAL_INTERN' ? 'a virtual intern' : 'employable'}.`,
            },
          },
        });
        return subscription;
      },
    );
  } catch (err) {
    // Already subscribed with this type (double submit) — idempotent no-op.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return;
    throw err;
  }

  updateTag(tags.notifications(company.userId));
}

export async function unsubscribeFromCompany(companyUserId: string, profileType: ProfileType): Promise<void> {
  const user = await requireRole('JOB_SEEKER');

  const existing = await db.companySubscription.findUnique({
    where: {
      companyId_jobSeekerId_profileType: {
        companyId: companyUserId,
        jobSeekerId: user.id,
        profileType,
      },
    },
    select: { id: true },
  });
  if (!existing) return;

  await withAudit(
    await auditCtx(user.id),
    {
      action: 'SUBSCRIPTION_CANCELLED',
      entity: 'company_subscription',
      entityId: existing.id,
      after: () => ({ companyId: companyUserId, profileType }),
    },
    (tx) => tx.companySubscription.delete({ where: { id: existing.id } }),
  );
}
