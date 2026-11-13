'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { logger } from '@/lib/observability/logger';
import { clientIp } from '@/lib/security/client-ip';
import { reindexJob } from '@/lib/search/index-job';
import { after } from 'next/server';
import { type ActionResult, fail, succeed } from '@/lib/action-result';
import { resend, EMAIL_FROM, isEmailSuppressed } from '@/lib/email/resend';
import { companyVerificationEmail, type CompanyDecision } from '@/lib/email/company-emails';

const REASON_MAX = 1000;

function requiredReason(reason: string | undefined, missing: string): ActionResult<string> {
  const text = reason?.trim() ?? '';
  if (!text) return fail(missing);
  if (text.length > REASON_MAX) return fail(`Keep the reason under ${REASON_MAX} characters.`);
  return succeed(text);
}

// Thrown inside the transaction to roll it back when the profile left PENDING
// between the admin loading the queue and deciding.
class AlreadyReviewed extends Error {}

// Trust & safety: an ADMIN reviews a company's self-submitted profile and
// either verifies it (unlocks full visibility — see JOB_UC_06.0's "unverified
// companies do not appear in the list") or rejects it with a reason the
// company reads on /employer-setup and in email, then fixes and resubmits.
export async function verifyCompany(
  companyProfileId: string,
  status: 'VERIFIED' | 'REJECTED',
  reason?: string,
): Promise<ActionResult> {
  const admin = await requireRole('ADMIN');

  let decision: CompanyDecision;
  if (status === 'VERIFIED') {
    decision = { status };
  } else if (status === 'REJECTED') {
    const parsed = requiredReason(
      reason,
      'Give a reason. The company reads it to fix their details.',
    );
    if (!parsed.ok) return parsed;
    decision = { status, reason: parsed.data };
  } else {
    return fail('Invalid decision.');
  }
  const rejectionReason = decision.status === 'REJECTED' ? decision.reason : null;

  const profile = await db.companyProfile.findUnique({
    where: { id: companyProfileId },
    select: {
      id: true,
      userId: true,
      companyName: true,
      verificationStatus: true,
      user: { select: { email: true, firstName: true } },
    },
  });
  if (!profile) return fail('Company not found.');

  const h = await headers();
  const ip = clientIp(h);
  const ua = h.get('user-agent') ?? null;

  try {
    await withAudit(
      { actorId: admin.id, ip, ua },
      {
        action: 'COMPANY_PROFILE_UPDATED',
        entity: 'company_profile',
        entityId: profile.id,
        before: { verificationStatus: profile.verificationStatus },
        after: () => ({ verificationStatus: status, reason: rejectionReason }),
      },
      async (tx) => {
        const { count } = await tx.companyProfile.updateMany({
          where: { id: profile.id, verificationStatus: 'PENDING' },
          data: { verificationStatus: status, rejectionReason, reviewedAt: new Date() },
        });
        if (count === 0) throw new AlreadyReviewed();
        await tx.notification.create({
          data: {
            userId: profile.userId,
            kind: 'ACCOUNT_UPDATE',
            payload: {
              message:
                decision.status === 'VERIFIED'
                  ? `${profile.companyName} is now verified and visible to jobseekers.`
                  : `${profile.companyName} was not verified. Reason: ${decision.reason}`,
              verificationStatus: status,
            },
          },
        });
      },
    );
  } catch (err) {
    if (err instanceof AlreadyReviewed) {
      return fail(`${profile.companyName} was already reviewed. Reload the page to see the queue.`);
    }
    throw err;
  }

  updateTag(tags.company(profile.userId));
  updateTag(tags.companies());
  updateTag(tags.notifications(profile.userId));

  // A non-VERIFIED company is redirected away from /company/*, notifications
  // included, so email is how it learns the outcome. Best-effort, after().
  after(async () => {
    try {
      if (await isEmailSuppressed(profile.user.email)) return;
      const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
      const { subject, text, html } = companyVerificationEmail({
        ...decision,
        recipientName: profile.user.firstName ?? profile.companyName,
        companyName: profile.companyName,
        url: `${site}${decision.status === 'VERIFIED' ? '/company/jobs/new' : '/employer-setup'}`,
      });
      await resend().emails.send({ from: EMAIL_FROM, to: profile.user.email, subject, text, html });
    } catch (err) {
      logger.warn(
        { err, companyProfileId: profile.id },
        'verification email failed (non-blocking)',
      );
    }
  });

  logger.info(
    { companyProfileId: profile.id, adminId: admin.id, status },
    'company verification status changed',
  );
  return succeed();
}

/**
 * Resolve a job report.
 *
 * ACTIONED needs a reason (kept in the audit event), removes the posting
 * (archived + soft-deleted, so it leaves the site, sitemap and search at once),
 * tells the company, warns everyone who applied, and resolves every other open
 * report on the same job. DISMISSED closes just this report. Either way the
 * decision is audited with the admin's id.
 */
export async function resolveJobReport(
  reportId: string,
  outcome: 'ACTIONED' | 'DISMISSED',
  reason?: string,
): Promise<ActionResult> {
  const admin = await requireRole('ADMIN');
  if (outcome !== 'ACTIONED' && outcome !== 'DISMISSED') return fail('Invalid decision.');

  let removalReason: string | null = null;
  if (outcome === 'ACTIONED') {
    const parsed = requiredReason(reason, 'Give a reason for removing this job.');
    if (!parsed.ok) return parsed;
    removalReason = parsed.data;
  }

  const report = await db.jobReport.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      status: true,
      jobPostId: true,
      jobPost: {
        select: {
          id: true,
          title: true,
          companyId: true,
          deletedAt: true,
          applications: { select: { jobSeekerId: true } },
        },
      },
    },
  });
  if (!report) return fail('Report not found.');
  if (report.status !== 'OPEN') return succeed();

  const applicantIds = report.jobPost.applications.map((a) => a.jobSeekerId);
  const h = await headers();
  const now = new Date();
  await withAudit(
    { actorId: admin.id, ip: clientIp(h), ua: h.get('user-agent') },
    {
      action: 'JOB_REPORT_RESOLVED',
      entity: 'job_post',
      entityId: report.jobPostId,
      after: () => ({ reportId, outcome, reason: removalReason }),
    },
    async (tx) => {
      if (outcome === 'ACTIONED') {
        await tx.jobReport.updateMany({
          where: { jobPostId: report.jobPostId, status: 'OPEN' },
          data: { status: 'ACTIONED', resolvedAt: now, resolvedBy: admin.id },
        });
        if (!report.jobPost.deletedAt) {
          await tx.jobPost.update({
            where: { id: report.jobPostId },
            data: { status: 'ARCHIVED', deletedAt: now },
          });
          await tx.notification.create({
            data: {
              userId: report.jobPost.companyId,
              kind: 'ACCOUNT_UPDATE',
              payload: {
                message: `Your job post "${report.jobPost.title}" was removed after a report was reviewed.`,
              },
            },
          });
        }
        // Even when the company had already archived it: a removed scam
        // posting is exactly the one its applicants need to hear about.
        await tx.notification.createMany({
          data: applicantIds.map((userId) => ({
            userId,
            kind: 'SYSTEM' as const,
            payload: {
              jobId: report.jobPostId,
              message: `A job you applied to, "${report.jobPost.title}", was removed after a safety review. Do not send money or personal documents to anyone who contacts you about it.`,
            },
          })),
        });
      } else {
        await tx.jobReport.update({
          where: { id: reportId },
          data: { status: 'DISMISSED', resolvedAt: now, resolvedBy: admin.id },
        });
      }
    },
  );

  if (outcome === 'ACTIONED') {
    updateTag(tags.job(report.jobPostId));
    updateTag(tags.jobs());
    updateTag(tags.notifications(report.jobPost.companyId));
    for (const id of applicantIds) updateTag(tags.notifications(id));
    after(async () => {
      try {
        await reindexJob(report.jobPostId); // de-indexes: deletedAt is set
      } catch (err) {
        logger.warn({ err, jobId: report.jobPostId }, 'deindex after moderation failed');
      }
    });
  }

  logger.info({ reportId, adminId: admin.id, outcome }, 'job report resolved');
  return succeed();
}
