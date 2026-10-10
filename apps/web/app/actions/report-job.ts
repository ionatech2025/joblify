'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { reportLimit } from '@/lib/ratelimit';
import { logger } from '@/lib/observability/logger';
import { clientIp } from '@/lib/security/client-ip';
import { type ActionResult, fail, succeed } from '@/lib/action-result';

// Trust & safety. Fake postings (advance-fee "jobs", off-platform "interviews"
// that ask for money, discriminatory ads) are the dominant abuse of job boards,
// and the company-verification step alone does not catch a verified account
// that goes bad. Any signed-in user can flag a posting; an admin resolves it
// (app/actions/admin.ts resolveJobReport).

const ReportSchema = z.object({
  jobPostId: z.string().uuid(),
  reason: z.enum(['SCAM', 'DISCRIMINATORY', 'MISLEADING', 'DUPLICATE', 'OTHER']),
  details: z.string().trim().max(1_000).optional(),
});

export async function reportJob(input: z.infer<typeof ReportSchema>): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = ReportSchema.safeParse(input);
  if (!parsed.success) return fail('Choose a reason for the report.');

  const rl = await reportLimit(user.id);
  if (!rl.success) return fail('You have sent a lot of reports today. Please try again tomorrow.');

  const job = await db.jobPost.findFirst({
    where: { id: parsed.data.jobPostId, status: 'PUBLISHED', deletedAt: null },
    select: { id: true, companyId: true },
  });
  if (!job) return fail('That job is no longer available.');
  // Not a way to attack a competitor's own listing from the owner's account,
  // and a company reporting itself is a mistake, not a report.
  if (job.companyId === user.id) return fail('You cannot report your own job posting.');

  const h = await headers();
  const details = parsed.data.details || null;
  await withAudit(
    { actorId: user.id, ip: clientIp(h), ua: h.get('user-agent') },
    {
      action: 'JOB_REPORTED',
      entity: 'job_post',
      entityId: job.id,
      // Reason only: free-text details may contain a third party's personal data.
      after: () => ({ reason: parsed.data.reason }),
    },
    (tx) =>
      // One report per (job, reporter): re-reporting refines it and re-opens a
      // dismissed one, instead of stacking duplicates.
      tx.jobReport.upsert({
        where: { jobPostId_reporterId: { jobPostId: job.id, reporterId: user.id } },
        create: {
          jobPostId: job.id,
          reporterId: user.id,
          reason: parsed.data.reason,
          details,
        },
        update: {
          reason: parsed.data.reason,
          details,
          status: 'OPEN',
          resolvedAt: null,
          resolvedBy: null,
        },
      }),
  );

  logger.info({ jobId: job.id, reporterId: user.id, reason: parsed.data.reason }, 'job reported');
  return succeed();
}
