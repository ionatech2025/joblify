'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import type { ApplicationStatus } from '@prisma/client';
import { requireRole, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { resend, EMAIL_FROM } from '@/lib/email/resend';
import { statusChange } from '@/lib/email/templates';
import { logger } from '@/lib/observability/logger';

export async function updateApplicantStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<void> {
  const user = await requireRole('COMPANY');

  // Tenancy: applicant must belong to one of this company's jobs.
  const application = await db.jobApplication.findFirst({
    where: { id: applicationId, jobPost: { companyId: user.id } },
    include: {
      jobPost: { include: { company: { include: { companyProfile: true } } } },
      jobSeeker: true,
    },
  });
  if (!application) throw new AuthError('FORBIDDEN');

  const previousStatus = application.status;
  if (previousStatus === status) return;

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  await withAudit(
    { actorId: user.id, ip, ua },
    {
      action: 'APPLICATION_STATUS_CHANGED',
      entity: 'job_application',
      entityId: applicationId,
      before: { status: previousStatus },
      after: () => ({ status }),
    },
    async (tx) => {
      await tx.jobApplication.update({
        where: { id: applicationId },
        data: { status },
      });
      await tx.notification.create({
        data: {
          userId: application.jobSeekerId,
          kind: 'APPLICATION_STATUS_CHANGED',
          payload: {
            applicationId,
            jobTitle: application.jobPost.title,
            companyName: application.jobPost.company.companyProfile?.companyName ?? 'Company',
            status,
            message: `Your application status changed to ${status}.`,
          },
        },
      });
    },
  );

  updateTag(tags.userApplications(application.jobSeekerId));
  updateTag(tags.notifications(application.jobSeekerId));
  updateTag(tags.jobApplicants(application.jobPostId));

  // Email notification (best-effort).
  void sendStatusEmail(application, status).catch((err) =>
    logger.warn({ err, applicationId }, 'status email send failed (non-blocking)'),
  );
}

async function sendStatusEmail(
  application: {
    jobSeeker: { email: string; firstName: string | null };
    jobPost: { title: string; company: { companyProfile: { companyName: string } | null } };
  },
  status: ApplicationStatus,
): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/jobseeker/applications`;
  const { subject, text, html } = statusChange({
    jobseekerName: application.jobSeeker.firstName ?? application.jobSeeker.email,
    jobTitle: application.jobPost.title,
    companyName: application.jobPost.company.companyProfile?.companyName ?? 'the team',
    status: status.replace('_', ' '),
    applicationUrl: url,
  });
  await resend().emails.send({
    from: EMAIL_FROM,
    to: application.jobSeeker.email,
    subject,
    text,
    html,
  });
}

export async function saveApplicantNote(applicationId: string, notes: string): Promise<void> {
  const user = await requireRole('COMPANY');

  // Tenancy: the application must belong to one of this company's jobs.
  const application = await db.jobApplication.findFirst({
    where: { id: applicationId, jobPost: { companyId: user.id } },
    select: { id: true, jobPostId: true },
  });
  if (!application) throw new AuthError('FORBIDDEN');

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  const text = notes.slice(0, 5000);

  await withAudit(
    { actorId: user.id, ip, ua },
    // Audit the event but not the (sensitive) note text — store only its length.
    { action: 'APPLICATION_NOTE_SAVED', entity: 'job_application', entityId: applicationId, after: () => ({ length: text.length }) },
    (tx) => tx.jobApplication.update({ where: { id: application.id }, data: { recruiterNotes: text || null } }),
  );

  updateTag(tags.jobApplicants(application.jobPostId));
}
