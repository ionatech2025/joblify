'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { updateTag } from 'next/cache';
import { Prisma, type ProfileType } from '@prisma/client';
import { requireRole, assertPlan, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { inviteLimit } from '@/lib/ratelimit';
import { logger } from '@/lib/observability/logger';
import { type ActionResult, fail, succeed } from '@/lib/action-result';

const INVITATION_TTL_DAYS = 30;

async function auditCtx(actorId: string) {
  const h = await headers();
  return {
    actorId,
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    ua: h.get('user-agent') ?? null,
  };
}

// Company invites a seeker to subscribe as EMPLOYABLE or VIRTUAL_INTERN
// (JOB_UC_10.0). One pending invitation per company/seeker/type.
export async function inviteJobseeker(
  jobSeekerUserId: string,
  profileType: ProfileType,
): Promise<ActionResult> {
  const user = await requireRole('COMPANY');
  assertPlan(user, 'PRO');

  const rl = await inviteLimit(user.id);
  if (!rl.success) return fail('Daily invitation limit reached. Try again tomorrow.');

  const seeker = await db.user.findFirst({
    where: { id: jobSeekerUserId, userType: 'JOB_SEEKER', deletedAt: null },
    select: { id: true },
  });
  if (!seeker) return fail('Job seeker not found.');

  const profile = await db.companyProfile.findUnique({
    where: { userId: user.id },
    select: { companyName: true },
  });
  const companyName = profile?.companyName ?? 'A company';

  const existing = await db.invitation.findUnique({
    where: {
      companyId_jobSeekerId_profileType: {
        companyId: user.id,
        jobSeekerId: seeker.id,
        profileType,
      },
    },
    select: { id: true, status: true },
  });
  // A live or already-answered invitation stands; re-inviting only makes sense
  // after a decline or expiry, where we refresh the existing row below.
  if (existing && existing.status === 'PENDING') return succeed();

  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  try {
    await withAudit(
      await auditCtx(user.id),
      {
        action: 'INVITATION_SENT',
        entity: 'invitation',
        after: (r) => ({ id: r.id, jobSeekerId: seeker.id, profileType }),
      },
      async (tx) => {
        const invitation = existing
          ? await tx.invitation.update({
              where: { id: existing.id },
              data: { status: 'PENDING', expiresAt, respondedAt: null },
              select: { id: true },
            })
          : await tx.invitation.create({
              data: { companyId: user.id, jobSeekerId: seeker.id, profileType, expiresAt },
              select: { id: true },
            });
        await tx.notification.create({
          data: {
            userId: seeker.id,
            kind: 'INVITATION_RECEIVED',
            payload: {
              invitationId: invitation.id,
              profileType,
              message: `${companyName} invited you to subscribe as ${profileType === 'VIRTUAL_INTERN' ? 'a virtual intern' : 'employable'}.`,
            },
          },
        });
        return invitation;
      },
    );
  } catch (err) {
    // Concurrent duplicate — the other invitation stands.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
      return succeed();
    throw err;
  }

  updateTag(tags.notifications(seeker.id));

  logger.info({ companyId: user.id, jobSeekerId: seeker.id, profileType }, 'invitation sent');
  return succeed();
}

// Seeker accepts or declines a pending invitation (JOB_UC_10.1). Accepting
// creates the matching CompanySubscription; either way the company is told.
export async function respondToInvitation(
  invitationId: string,
  response: 'ACCEPT' | 'DECLINE',
): Promise<ActionResult> {
  const user = await requireRole('JOB_SEEKER');

  const invitation = await db.invitation.findFirst({
    where: { id: invitationId, jobSeekerId: user.id },
    include: {
      company: { select: { id: true, companyProfile: { select: { companyName: true } } } },
    },
  });
  if (!invitation) throw new AuthError('FORBIDDEN');
  if (invitation.status !== 'PENDING') return succeed(); // already answered
  if (invitation.expiresAt < new Date()) {
    await db.invitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
    return fail('This invitation has expired.');
  }

  // UC_10.1: a base profile is required before accepting a subscription invite.
  if (response === 'ACCEPT') {
    const profile = await db.jobSeekerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) redirect(`/onboarding?invitationId=${invitation.id}`);
  }

  const seekerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'A job seeker';
  const status = response === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';

  await withAudit(
    await auditCtx(user.id),
    {
      action: 'INVITATION_RESPONDED',
      entity: 'invitation',
      entityId: invitation.id,
      after: () => ({ status }),
    },
    async (tx) => {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status, respondedAt: new Date() },
      });
      if (response === 'ACCEPT') {
        // Accepting doubles as subscribing (idempotent per type).
        await tx.companySubscription.upsert({
          where: {
            companyId_jobSeekerId_profileType: {
              companyId: invitation.companyId,
              jobSeekerId: user.id,
              profileType: invitation.profileType,
            },
          },
          create: {
            companyId: invitation.companyId,
            jobSeekerId: user.id,
            profileType: invitation.profileType,
          },
          update: {},
        });
      }
      await tx.notification.create({
        data: {
          userId: invitation.companyId,
          kind: 'INVITATION_RESPONDED',
          payload: {
            invitationId: invitation.id,
            profileType: invitation.profileType,
            status,
            message: `${seekerName} ${status === 'ACCEPTED' ? 'accepted' : 'declined'} your ${invitation.profileType === 'VIRTUAL_INTERN' ? 'virtual-intern' : 'employable'} invitation.`,
          },
        },
      });
    },
  );

  updateTag(tags.notifications(invitation.companyId));

  logger.info(
    { invitationId: invitation.id, jobSeekerId: user.id, status },
    'invitation responded to',
  );
  return succeed();
}
