'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { z } from 'zod';
import { requireRole, assertPlan, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';

// FormData adapter for the jobseeker-directory share form (job picked from a
// <select>, seeker id bound).
export async function shareJobFromForm(jobSeekerUserId: string, formData: FormData): Promise<void> {
  const jobPostId = z.string().uuid().parse(formData.get('jobPostId'));
  await shareJobWithJobseeker(jobPostId, jobSeekerUserId);
}

// Flowchart: "share job post link to job seekers of interest". Sends the
// seeker an in-app notification that links to the public job page.
// JOB_UC_14.0: sharing a job post is a premium outreach action.
export async function shareJobWithJobseeker(jobPostId: string, jobSeekerUserId: string): Promise<void> {
  const user = await requireRole('COMPANY');
  assertPlan(user, 'PRO');

  const job = await db.jobPost.findFirst({
    where: { id: jobPostId, companyId: user.id, status: 'PUBLISHED', deletedAt: null },
    select: { id: true, slug: true, title: true },
  });
  if (!job) throw new AuthError('FORBIDDEN');

  const seeker = await db.user.findFirst({
    where: { id: jobSeekerUserId, userType: 'JOB_SEEKER', deletedAt: null },
    select: { id: true },
  });
  if (!seeker) throw new Error('Job seeker not found.');

  const profile = await db.companyProfile.findUnique({
    where: { userId: user.id },
    select: { companyName: true },
  });

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  await withAudit(
    { actorId: user.id, ip, ua },
    { action: 'JOB_SHARED', entity: 'job_post', entityId: job.id, after: () => ({ jobSeekerId: seeker.id }) },
    (tx) =>
      tx.notification.create({
        data: {
          userId: seeker.id,
          kind: 'JOB_SHARED',
          payload: {
            jobPostId: job.id,
            jobSlug: job.slug,
            message: `${profile?.companyName ?? 'A company'} shared a job with you: ${job.title}.`,
          },
        },
      }),
  );

  updateTag(tags.notifications(seeker.id));
}
