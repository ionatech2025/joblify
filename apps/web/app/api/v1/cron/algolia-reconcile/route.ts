import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reindexJob, drainIndexOutbox } from '@/lib/search/index-job';
import { logger } from '@/lib/observability/logger';

// Every 15min: re-push recently-updated jobs and remove soft-deleted ones.
// Idempotent — Algolia upserts replace records, deletes are no-ops if absent.

export const maxDuration = 60;

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const since = new Date(Date.now() - 30 * 60_000); // last 30min

  const recent = await db.jobPost.findMany({
    where: { updatedAt: { gte: since } },
    select: { id: true },
    take: 500,
  });

  let ok = 0;
  let fail = 0;
  for (const { id } of recent) {
    try {
      await reindexJob(id);
      ok++;
    } catch (err) {
      logger.error({ id, err }, 'reindex failed');
      fail++;
    }
  }

  // Drain the durable retry queue for syncs that failed outside the scan window.
  const outbox = await drainIndexOutbox();

  return NextResponse.json({ ok, fail, scanned: recent.length, outbox, at: new Date().toISOString() });
}
