'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { updateTag } from 'next/cache';
import { Prisma, type ProfileType } from '@prisma/client';
import { requireRole, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';

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
export async function inviteJobseeker(jobSeekerUserId: string, profileType: ProfileType): Promise<void> {
  const user = await requireRole('COMPANY');

  const seeker = await db.user.findFirst({
    where: { id: jobSeekerUserId, userType: 'JOB_SEEKER', deletedAt: null },
    select: { id: true },
  });
  if (!seeker) throw new Error('Job seeker not found.');

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
  if (existing && existing.status === 'PENDING') return;

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
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return;
    throw err;
  }

  updateTag(tags.notifications(seeker.id));
}

// Seeker accepts or declines a pending invitation (JOB_UC_10.1). Accepting
// creates the matching CompanySubscription; either way the company is told.
export async function respondToInvitation(invitationId: string, response: 'ACCEPT' | 'DECLINE'): Promise<void> {
  const user = await requireRole('JOB_SEEKER');

  const invitation = await db.invitation.findFirst({
    where: { id: invitationId, jobSeekerId: user.id },
    include: { company: { select: { id: true, companyProfile: { select: { companyName: true } } } } },
  });
  if (!invitation) throw new AuthError('FORBIDDEN');
  if (invitation.status !== 'PENDING') return; // already answered
  if (invitation.expiresAt < new Date()) {
    await db.invitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
    throw new Error('This invitation has expired.');
  }

  // UC_10.1: a base profile is required before accepting a subscription invite.
  if (response === 'ACCEPT') {
    const profile = await db.jobSeekerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) redirect('/onboarding');
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
}
