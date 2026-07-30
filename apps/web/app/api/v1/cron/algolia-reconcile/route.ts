import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { db } from '@/lib/db';
import { requireCronAuth } from '@/lib/cron-auth';
import { reindexJob, drainIndexOutbox } from '@/lib/search/index-job';
import { runResumeParse } from '@/workflows/resume-parse.workflow';
import { embedJobPost } from '@/workflows/match-score.workflow';
import { logger } from '@/lib/observability/logger';

// Every run: (1) re-push recently-updated jobs and remove soft-deleted ones,
// (2) drain the durable index_outbox retry queue, then (3) sweep for stranded
// AI derivations — the parse/embed "workflows" are plain inline functions with
// no retry runtime, so a transient AI failure leaves resumes
// (parsedJson/embedding NULL) and jobs (embedding NULL) stuck until this
// sweep re-runs them. Idempotent — Algolia upserts replace records, deletes
// are no-ops if absent, and the parse/embed paths skip completed work.

// 20 resume parses at 8–20s p95 each don't fit the old 60s budget; 300s
// matches the other cron routes, and the sweep additionally stops itself at
// ~80% wall clock (SWEEP_DEADLINE_FRACTION) so the response always goes out.
export const maxDuration = 300;

// Per-run bounds for the AI sweep.
const SWEEP_LIMIT = 20;
// Skip resumes younger than this: their upload-path after() parse is likely
// still in flight, and double-parsing would waste a Haiku call.
const SWEEP_MIN_AGE_MS = 10 * 60_000;
// Poison guard: give up on a resume after this many sweep attempts.
const MAX_PARSE_ATTEMPTS = 5;
const SWEEP_DEADLINE_FRACTION = 0.8;

type SweepSummary = {
  resumesTried: number;
  resumesRepaired: number;
  resumesFailed: number;
  jobsTried: number;
  jobsEmbedded: number;
  jobsFailed: number;
  stoppedEarly: boolean;
};

export async function GET(req: Request) {
  const deny = requireCronAuth(req);
  if (deny) return deny;

  const startedAt = Date.now();
  const deadline = startedAt + maxDuration * 1000 * SWEEP_DEADLINE_FRACTION;

  // `?all=1` backfills every published job (one-off, e.g. after seeding or first
  // wiring Algolia). Default scans only the last 30min for the scheduled cron.
  const all = new URL(req.url).searchParams.get('all') === '1';
  const since = new Date(Date.now() - 30 * 60_000);

  const recent = await db.jobPost.findMany({
    where: all ? { status: 'PUBLISHED', deletedAt: null } : { updatedAt: { gte: since } },
    select: { id: true },
    take: 1000,
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

  const sweep = await sweepStrandedAiDerivations(deadline);

  return NextResponse.json({
    ok,
    fail,
    scanned: recent.length,
    outbox,
    sweep,
    at: new Date().toISOString(),
  });
}

// Bounded recovery sweep. Oldest first so nothing starves; each resume attempt
// is counted up front (crash-safe) and capped so poison files can't loop
// forever. Serial on purpose: one AI call in flight keeps the run inside the
// wall-clock deadline check granularity.
async function sweepStrandedAiDerivations(deadline: number): Promise<SweepSummary> {
  const s: SweepSummary = {
    resumesTried: 0,
    resumesRepaired: 0,
    resumesFailed: 0,
    jobsTried: 0,
    jobsEmbedded: 0,
    jobsFailed: 0,
    stoppedEarly: false,
  };

  // Resumes stuck half-processed. Raw SQL: `embedding` is an Unsupported()
  // pgvector column, so Prisma's typed `where` can't test it for NULL.
  const createdBefore = new Date(Date.now() - SWEEP_MIN_AGE_MS);
  const staleResumes = await db.$queryRaw<Array<{ id: string; parseAttempts: number }>>`
    SELECT id, "parseAttempts"
      FROM resumes
     WHERE "deletedAt" IS NULL
       AND ("parsedJson" IS NULL OR embedding IS NULL)
       AND "createdAt" < ${createdBefore}
       AND "parseAttempts" < ${MAX_PARSE_ATTEMPTS}
  ORDER BY "createdAt" ASC
     LIMIT ${SWEEP_LIMIT}
  `;

  for (const row of staleResumes) {
    if (Date.now() > deadline) {
      s.stoppedEarly = true;
      break;
    }
    s.resumesTried++;
    const attempts = row.parseAttempts + 1;
    // Count the attempt before trying: a crash mid-parse must still consume it.
    await db.resume.update({ where: { id: row.id }, data: { parseAttempts: { increment: 1 } } });
    try {
      await runResumeParse({ resumeId: row.id });
      s.resumesRepaired++;
    } catch (err) {
      s.resumesFailed++;
      logger.error({ err, resumeId: row.id, attempts }, 'sweep: resume parse retry failed');
      Sentry.captureException(err, { tags: { resumeId: row.id } });
      if (attempts >= MAX_PARSE_ATTEMPTS) {
        // Fires exactly once: the attempts filter excludes this row from now on.
        logger.error(
          { resumeId: row.id, attempts },
          'sweep: resume permanently failed — parse attempts cap reached',
        );
        Sentry.captureMessage('resume parse permanently failed after max sweep attempts', {
          level: 'error',
          tags: { resumeId: row.id },
        });
      }
    }
  }

  // Published jobs that never got an embedding (e.g. published before the
  // publish-time embed existed, or the embed call failed). One cheap embed
  // call each — no attempts column needed; a failure is retried next sweep
  // and surfaced via Sentry.
  const unembeddedJobs = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id
      FROM job_posts
     WHERE status = 'PUBLISHED'
       AND "deletedAt" IS NULL
       AND embedding IS NULL
  ORDER BY "publishedAt" ASC NULLS FIRST
     LIMIT ${SWEEP_LIMIT}
  `;

  for (const { id } of unembeddedJobs) {
    if (Date.now() > deadline) {
      s.stoppedEarly = true;
      break;
    }
    s.jobsTried++;
    try {
      await embedJobPost(id);
      s.jobsEmbedded++;
    } catch (err) {
      s.jobsFailed++;
      logger.error({ err, jobId: id }, 'sweep: job embedding failed');
      Sentry.captureException(err, { tags: { jobId: id } });
    }
  }

  if (s.stoppedEarly) {
    logger.warn(
      { ...s },
      'sweep: stopped early at the wall-clock deadline; remainder picked up next run',
    );
  }

  return s;
}
