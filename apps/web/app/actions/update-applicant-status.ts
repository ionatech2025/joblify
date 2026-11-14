'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { after } from 'next/server';
import type { ApplicationStatus } from '@prisma/client';
import { requireRole, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { resend, EMAIL_FROM, isEmailSuppressed } from '@/lib/email/resend';
import { notSelected, statusChange } from '@/lib/email/templates';
import { logger } from '@/lib/observability/logger';
import { clientIp } from '@/lib/security/client-ip';
import {
  CHAT_JOIN_STATUSES,
  checkRecruiterTransition,
  emailsCandidate,
} from '@/lib/applications/transitions';
import { APPLICATION_STATUS_LABEL } from '@/lib/ui/status';
import { type ActionResult, fail, succeed } from '@/lib/action-result';

class StatusMovedError extends Error {}

export async function updateApplicantStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<ActionResult> {
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
  if (previousStatus === status) return succeed();

  // Expected failure → RETURNED (a thrown message is redacted in production).
  const transition = checkRecruiterTransition(previousStatus, status);
  if (!transition.ok) return fail(transition.reason);

  const h = await headers();
  const ip = clientIp(h);
  const ua = h.get('user-agent') ?? null;

  try {
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
        const { count } = await tx.jobApplication.updateMany({
          where: { id: applicationId, status: previousStatus },
          data: { status },
        });
        if (count === 0) throw new StatusMovedError();
        await tx.notification.create({
          data: {
            userId: application.jobSeekerId,
            kind: 'APPLICATION_STATUS_CHANGED',
            payload: {
              applicationId,
              jobTitle: application.jobPost.title,
              companyName: application.jobPost.company.companyProfile?.companyName ?? 'Company',
              status,
              message: `Your application status changed to ${APPLICATION_STATUS_LABEL[status]}.`,
            },
          },
        });

        if (!CHAT_JOIN_STATUSES.includes(status)) {
          await tx.chatParticipant.deleteMany({
            where: {
              userId: application.jobSeekerId,
              chatArea: { jobPostId: application.jobPostId },
            },
          });
        }

        // Shortlisted-or-beyond applicants join the job's chat area (if the
        // company opened one) so the team can orient them and share interview
        // details there. JOB_UC_12.0: this auto-join is premium — the status
        // change itself isn't, so skip the join rather than block the status
        // update for a non-PRO company.
        if (CHAT_JOIN_STATUSES.includes(status) && user.plan === 'PRO') {
          const area = await tx.chatArea.findUnique({
            where: { jobPostId: application.jobPostId },
            select: { id: true, title: true },
          });
          if (area) {
            const member = await tx.chatParticipant.findUnique({
              where: {
                chatAreaId_userId: { chatAreaId: area.id, userId: application.jobSeekerId },
              },
              select: { chatAreaId: true },
            });
            if (!member) {
              await tx.chatParticipant.create({
                data: { chatAreaId: area.id, userId: application.jobSeekerId },
              });
              await tx.notification.create({
                data: {
                  userId: application.jobSeekerId,
                  kind: 'CHAT_AREA_ADDED',
                  payload: {
                    chatAreaId: area.id,
                    message: `You were added to the chat area “${area.title}”.`,
                  },
                },
              });
            }
          }
        }
      },
    );
  } catch (err) {
    if (!(err instanceof StatusMovedError)) throw err;
    updateTag(tags.jobApplicants(application.jobPostId));
    return fail(
      'This application changed before your update was saved, so nothing was changed. The board now shows its current status.',
    );
  }

  updateTag(tags.userApplications(application.jobSeekerId));
  updateTag(tags.notifications(application.jobSeekerId));
  updateTag(tags.jobApplicants(application.jobPostId));

  // Email notification (best-effort), run inside after(): a floating promise
  // can be dropped the moment the response is sent on Fluid Compute.
  if (emailsCandidate(previousStatus, status)) {
    after(async () => {
      try {
        await sendStatusEmail(application, status);
      } catch (err) {
        logger.warn({ err, applicationId }, 'status email send failed (non-blocking)');
      }
    });
  }

  return succeed();
}

async function sendStatusEmail(
  application: {
    jobSeeker: { email: string; firstName: string | null };
    jobPost: { title: string; company: { companyProfile: { companyName: string } | null } };
  },
  status: ApplicationStatus,
): Promise<void> {
  // Bounced / complained addresses are suppressed everywhere else; this path
  // used to skip the check and keep mailing them, which is what damages a
  // sending domain's reputation.
  if (await isEmailSuppressed(application.jobSeeker.email)) return;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const who = {
    jobseekerName: application.jobSeeker.firstName ?? application.jobSeeker.email,
    jobTitle: application.jobPost.title,
    companyName: application.jobPost.company.companyProfile?.companyName ?? 'the team',
  };
  const { subject, text, html } =
    status === 'REJECTED'
      ? notSelected({ ...who, jobsUrl: `${site}/jobs` })
      : statusChange({
          ...who,
          status: APPLICATION_STATUS_LABEL[status],
          applicationUrl: `${site}/jobseeker/applications`,
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
  const ip = clientIp(h);
  const ua = h.get('user-agent') ?? null;

  const text = notes.slice(0, 5000);

  await withAudit(
    { actorId: user.id, ip, ua },
    // Audit the event but not the (sensitive) note text — store only its length.
    {
      action: 'APPLICATION_NOTE_SAVED',
      entity: 'job_application',
      entityId: applicationId,
      after: () => ({ length: text.length }),
    },
    (tx) =>
      tx.jobApplication.update({
        where: { id: application.id },
        data: { recruiterNotes: text || null },
      }),
  );

  updateTag(tags.jobApplicants(application.jobPostId));
}
