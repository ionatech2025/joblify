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
): Promise<ActionResult> {
  const admin = await requireRole('ADMIN');

  const profile = await db.companyProfile.findUnique({
    where: { id: companyProfileId },
    select: { id: true, userId: true, companyName: true, verificationStatus: true },
  });
  if (!profile) return fail('Company not found.');

  const h = await headers();
  const ip = clientIp(h);
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

  logger.info(
    { companyProfileId: profile.id, adminId: admin.id, status },
    'company verification status changed',
  );
  return succeed();
}

/**
 * Resolve a job report.
 *
 * ACTIONED removes the posting (archived + soft-deleted, so it leaves the site,
 * sitemap and search at once), tells the company, and resolves every other open
 * report on the same job. DISMISSED closes just this report. Either way the
 * decision is audited with the admin's id.
 */
export async function resolveJobReport(
  reportId: string,
  outcome: 'ACTIONED' | 'DISMISSED',
): Promise<ActionResult> {
  const admin = await requireRole('ADMIN');
  if (outcome !== 'ACTIONED' && outcome !== 'DISMISSED') return fail('Invalid decision.');

  const report = await db.jobReport.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      status: true,
      jobPostId: true,
      jobPost: { select: { id: true, title: true, companyId: true, deletedAt: true } },
    },
  });
  if (!report) return fail('Report not found.');
  if (report.status !== 'OPEN') return succeed();

  const h = await headers();
  const now = new Date();
  await withAudit(
    { actorId: admin.id, ip: clientIp(h), ua: h.get('user-agent') },
    {
      action: 'JOB_REPORT_RESOLVED',
      entity: 'job_post',
      entityId: report.jobPostId,
      after: () => ({ reportId, outcome }),
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
