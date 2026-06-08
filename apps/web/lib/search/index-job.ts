import { db } from '@/lib/db';
import { upsertJob, deleteJob, toJobRecord } from './algolia';
import { logger } from '@/lib/observability/logger';

// Single entrypoint for keeping Algolia in sync. Called from Server Actions on
// post / edit / status change. On failure the job is left in a `pending` outbox
// row that the algolia-reconcile cron drains.
//
// We intentionally do NOT block the caller on Algolia — write Postgres first,
// fire-and-forget the index, log + outbox on failure. The cached JD page is
// authoritative for SEO; Algolia is for the search index only.

export async function reindexJob(jobId: string): Promise<void> {
  const job = await db.jobPost.findUnique({
    where: { id: jobId },
    include: {
      company: { include: { companyProfile: true } },
      skills: { include: { skill: true } },
    },
  });

  if (!job) {
    await deleteJob(jobId).catch((err) => enqueueRetry(jobId, 'delete', err));
    return;
  }

  if (job.deletedAt || job.status !== 'PUBLISHED') {
    await deleteJob(jobId).catch((err) => enqueueRetry(jobId, 'delete', err));
    return;
  }

  const record = toJobRecord(job, job.skills.map((js) => js.skill.label));

  try {
    await upsertJob(record);
  } catch (err) {
    await enqueueRetry(jobId, 'upsert', err);
  }
}

async function enqueueRetry(jobId: string, op: 'upsert' | 'delete', err: unknown): Promise<void> {
  logger.error({ jobId, op, err }, 'Algolia sync failed; will be picked up by reconcile cron');
  // TODO(week-4 follow-up): write to `index_outbox` table once that model
  // is added. For now the algolia-reconcile cron re-scans recently-updated
  // jobs and re-upserts them, which is good-enough for solo-team scope.
}
