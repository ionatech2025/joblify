import * as Sentry from '@sentry/nextjs';
import { db } from '@/lib/db';
import { upsertJob, deleteJob, toJobRecord } from './algolia';
import { logger } from '@/lib/observability/logger';

const MAX_INDEX_ATTEMPTS = 10;

// Single entrypoint for keeping Algolia in sync. Called from Server Actions on
// post / edit / status change. Never blocks the caller: write Postgres first,
// fire-and-forget the index, and on failure queue a durable index_outbox row
// that the algolia-reconcile cron drains. The cached JD page is authoritative
// for SEO; Algolia is the search index only.
export async function reindexJob(jobId: string): Promise<void> {
  try {
    await syncJobToAlgolia(jobId);
  } catch (err) {
    await enqueueRetry(jobId, err);
  }
}

// Push the job's current state to Algolia (upsert if live, else delete). Throws
// on Algolia failure so callers (reindexJob, the outbox drain) choose how to retry.
export async function syncJobToAlgolia(jobId: string): Promise<void> {
  const job = await db.jobPost.findUnique({
    where: { id: jobId },
    include: {
      company: { include: { companyProfile: true } },
      skills: { include: { skill: true } },
    },
  });

  if (!job || job.deletedAt || job.status !== 'PUBLISHED') {
    await deleteJob(jobId);
    return;
  }

  const record = toJobRecord(
    job,
    job.skills.map((js) => js.skill.label),
  );
  await upsertJob(record);
}

async function enqueueRetry(jobId: string, err: unknown): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(
    { jobId, err },
    'Algolia sync failed; queued in index_outbox for the reconcile cron',
  );
  Sentry.captureException(err, { tags: { jobId } });
  try {
    await db.indexOutbox.upsert({
      where: { entityId: jobId },
      create: { entityId: jobId, lastError: message.slice(0, 500) },
      update: { attempts: { increment: 1 }, lastError: message.slice(0, 500) },
    });
  } catch (dbErr) {
    // The retry queue itself failed — without Sentry this job silently falls
    // out of both Algolia and the reconcile loop.
    logger.error({ jobId, dbErr }, 'failed to write index_outbox row');
    Sentry.captureException(dbErr, { tags: { jobId } });
  }
}

// Drain pending index_outbox rows: retry the sync, delete on success, bump
// attempts on failure, drop after MAX_INDEX_ATTEMPTS. Called by the cron.
export async function drainIndexOutbox(
  limit = 200,
): Promise<{ drained: number; failed: number; dropped: number }> {
  const rows = await db.indexOutbox.findMany({ orderBy: { createdAt: 'asc' }, take: limit });
  let drained = 0;
  let failed = 0;
  let dropped = 0;

  for (const row of rows) {
    try {
      await syncJobToAlgolia(row.entityId);
      await db.indexOutbox.delete({ where: { id: row.id } });
      drained++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (row.attempts + 1 >= MAX_INDEX_ATTEMPTS) {
        await db.indexOutbox.delete({ where: { id: row.id } });
        dropped++;
        logger.error(
          { entityId: row.entityId, attempts: row.attempts + 1 },
          'index_outbox row dropped after max attempts',
        );
      } else {
        await db.indexOutbox.update({
          where: { id: row.id },
          data: { attempts: { increment: 1 }, lastError: message.slice(0, 500) },
        });
        failed++;
      }
    }
  }

  return { drained, failed, dropped };
}
