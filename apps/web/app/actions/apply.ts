'use server';

import { updateTag } from 'next/cache';
import { z } from 'zod';
import { headers } from 'next/headers';
import { requireRole, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { applyLimit } from '@/lib/ratelimit';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { resend, EMAIL_FROM, isEmailSuppressed } from '@/lib/email/resend';
import { applicationConfirm } from '@/lib/email/templates';
import { logger } from '@/lib/observability/logger';
import * as Sentry from '@sentry/nextjs';
import { checkBotId } from 'botid/server';
import { after } from 'next/server';
import { type ActionResult, fail, succeed } from '@/lib/action-result';
import { runResumeParse } from '@/workflows/resume-parse.workflow';
import { runMatchScore } from '@/workflows/match-score.workflow';
import { CLOSED_APPLICATION_STATUSES } from '@/lib/ui/status';

const ApplySchema = z.object({
  jobId: z.string().uuid(),
  jobSlug: z.string().min(1),
  resumeId: z.string().uuid(),
  coverLetter: z.string().max(5000).optional(),
  acknowledgedDataUse: z.literal('on'),
});

export async function submitApplication(formData: FormData): Promise<ActionResult> {
  // 1. BotID Pro on the apply funnel.
  const verdict = await checkBotId();
  if (verdict.isBot) return fail('Suspicious traffic. Please try again.');

  // 2. Auth.
  const user = await requireRole('JOB_SEEKER');

  // 3. Rate limit per user (20/day).
  const rl = await applyLimit(user.id);
  if (!rl.success) return fail('Daily application limit reached. Try again tomorrow.');

  // 4. Validate.
  const parsed = ApplySchema.safeParse({
    jobId: formData.get('jobId'),
    jobSlug: formData.get('jobSlug'),
    resumeId: formData.get('resumeId'),
    coverLetter: formData.get('coverLetter') || undefined,
    acknowledgedDataUse: formData.get('acknowledgedDataUse'),
  });
  if (!parsed.success) return fail('Invalid application data.');

  // 5. Ownership: resume must belong to this user.
  const resume = await db.resume.findFirst({
    where: { id: parsed.data.resumeId, userId: user.id, deletedAt: null },
    select: { id: true },
  });
  if (!resume) throw new AuthError('FORBIDDEN');

  // 6. Job must be live and, if it has a deadline, still open.
  const job = await db.jobPost.findFirst({
    where: { id: parsed.data.jobId, status: 'PUBLISHED', deletedAt: null },
    include: { company: { include: { companyProfile: true } } },
  });
  if (!job) return fail('Job not available for application.');
  if (job.applicationDeadline && job.applicationDeadline < new Date()) {
    return fail('The application deadline for this job has passed.');
  }

  // The UI already blocks re-applying, but check here too — the compound
  // unique constraint is the backstop, not the primary UX.
  const existing = await db.jobApplication.findUnique({
    where: { jobPostId_jobSeekerId: { jobPostId: job.id, jobSeekerId: user.id } },
    select: { id: true },
  });
  if (existing) return fail('You already applied to this job.');

  // 7. Capture audit context.
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  // 8. Insert + audit in a single tx.
  const application = await withAudit(
    { actorId: user.id, ip, ua },
    {
      action: 'APPLICATION_SUBMITTED',
      entity: 'job_application',
      after: (r) => ({ id: r.id, status: r.status }),
    },
    async (tx) =>
      tx.jobApplication.create({
        data: {
          jobPostId: job.id,
          jobSeekerId: user.id,
          resumeId: resume.id,
          coverLetter: parsed.data.coverLetter ?? null,
          status: 'SUBMITTED',
        },
      }),
  );

  // 9. Invalidate downstream caches.
  updateTag(tags.userApplications(user.id));
  updateTag(tags.jobApplicants(job.id));

  // 10. Email confirmation (best-effort — do not block apply path on it).
  resendSafe(async () => {
    if (await isEmailSuppressed(user.email)) return;
    const { subject, text, html } = applicationConfirm({
      jobseekerName: user.firstName ?? user.email,
      jobTitle: job.title,
      companyName: job.company.companyProfile?.companyName ?? 'the team',
      applicationUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/jobseeker/applications`,
    });
    await resend().emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject,
      text,
      html,
    });
  });

  // 11. Off the response path: ensure the resume is parsed/embedded (usually
  //     already done at upload — idempotent no-op), then compute the match
  //     score, which reads that embedding. Failures are logged, never block.
  after(async () => {
    try {
      await runResumeParse({ resumeId: resume.id });
    } catch (err) {
      logger.warn({ err, resumeId: resume.id }, 'resume-parse failed (post-apply)');
      Sentry.captureException(err, { tags: { resumeId: resume.id, userId: user.id } });
    }
    try {
      await runMatchScore({ jobPostId: job.id, jobSeekerId: user.id });
    } catch (err) {
      logger.warn({ err, jobId: job.id, userId: user.id }, 'match-score failed (post-apply)');
      Sentry.captureException(err, { tags: { jobId: job.id, userId: user.id } });
    }
  });

  logger.info(
    { applicationId: application.id, userId: user.id, jobId: job.id },
    'application submitted',
  );
  return succeed();
}

// JOB_UC_09.0: a jobseeker can withdraw their own application any time
// before it reaches a terminal state. ApplicationStatus.WITHDRAWN was fully
// modeled (lib/ui/status.ts already has its label + tone) but had no writer.
export async function withdrawApplication(applicationId: string): Promise<ActionResult> {
  const user = await requireRole('JOB_SEEKER');

  const application = await db.jobApplication.findFirst({
    where: { id: applicationId, jobSeekerId: user.id },
    include: { jobPost: { select: { id: true, title: true, companyId: true } } },
  });
  if (!application) throw new AuthError('FORBIDDEN');
  if (CLOSED_APPLICATION_STATUSES.includes(application.status)) {
    return fail('This application is already closed and can’t be withdrawn.');
  }

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  await withAudit(
    { actorId: user.id, ip, ua },
    {
      action: 'APPLICATION_STATUS_CHANGED',
      entity: 'job_application',
      entityId: applicationId,
      before: { status: application.status },
      after: () => ({ status: 'WITHDRAWN' }),
    },
    async (tx) => {
      await tx.jobApplication.update({
        where: { id: applicationId },
        data: { status: 'WITHDRAWN' },
      });
      await tx.notification.create({
        data: {
          userId: application.jobPost.companyId,
          kind: 'APPLICATION_STATUS_CHANGED',
          payload: {
            applicationId,
            jobTitle: application.jobPost.title,
            message: `${user.firstName ?? user.email} withdrew their application for ${application.jobPost.title}.`,
          },
        },
      });
    },
  );

  updateTag(tags.userApplications(user.id));
  updateTag(tags.jobApplicants(application.jobPost.id));
  updateTag(tags.notifications(application.jobPost.companyId));

  logger.info({ applicationId, userId: user.id }, 'application withdrawn');
  return succeed();
}

function resendSafe(fn: () => Promise<unknown>): void {
  fn().catch((err) => {
    logger.warn({ err }, 'email send failed (non-blocking)');
    Sentry.captureException(err);
  });
}
