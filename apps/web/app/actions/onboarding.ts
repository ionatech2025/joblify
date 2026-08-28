'use server';

import { after } from 'next/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser, AuthError } from '@/lib/auth';
import { withAudit } from '@/lib/audit';
import { logger } from '@/lib/observability/logger';
import { respondToInvitation } from './invitations';

const ProfileTypeSchema = z.enum(['EMPLOYABLE', 'VIRTUAL_INTERN']);

// Job-seeker branch of onboarding ("Employable or Virtual Intern?"). Creates
// the JobSeekerProfile with the chosen type; the company branch is
// /employer-setup → createCompanyProfile.
export async function completeJobSeekerOnboarding(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.userType !== 'JOB_SEEKER') throw new AuthError('FORBIDDEN');

  const profileType = ProfileTypeSchema.parse(formData.get('profileType'));
  const invitationId = formData.get('invitationId');

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  await withAudit(
    { actorId: user.id, ip, ua },
    {
      action: 'USER_PROFILE_UPDATED',
      entity: 'job_seeker_profile',
      entityId: user.id,
      after: () => ({ profileType }),
    },
    (tx) =>
      tx.jobSeekerProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, profileType },
        update: { profileType },
      }),
  );

  logger.info({ userId: user.id, profileType }, 'job seeker onboarding completed');

  // respondToInvitation redirected here mid-accept because no profile existed
  // yet — now that one does, finish that accept rather than losing it.
  //
  // Deferred with after(): this is already best-effort (its failure is caught
  // and logged, never surfaced), and it is a second round of database writes.
  // Awaiting it inline held the redirect — and the user's blank screen — open
  // for the whole of it. The profile upsert above is the only thing that has to
  // land before /jobseeker/profile is safe to render.
  //
  // The one path where respondToInvitation redirects is "no profile yet", which
  // the upsert above has just ruled out, so nothing here can throw a redirect
  // into a post-response callback.
  //
  // The audit write deliberately stays inside withAudit's transaction rather
  // than moving here too: lib/audit.ts pairs the mutation and its AuditEvent in
  // one transaction precisely so the trail cannot drift from reality, and
  // docs/COMPLIANCE.md depends on that. Two round trips is the price of it.
  if (typeof invitationId === 'string' && invitationId) {
    after(async () => {
      try {
        await respondToInvitation(invitationId, 'ACCEPT');
      } catch (err) {
        logger.warn({ err, userId: user.id, invitationId }, 'resumed invitation accept failed');
      }
    });
  }

  redirect('/jobseeker/profile');
}
