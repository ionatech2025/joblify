// Compute a (resume, jobPost) semantic match score. Plain inline function —
// no durable-execution runtime; callers invoke it off the response path via
// Next's `after()` and failures are logged, never retried in-place.
//
// Strategy: cosine similarity of pre-computed embeddings. The resume
// embedding is written by resume-parse.workflow.ts; the JD embedding is
// written by embedJobPost() below and cached in `job_posts.embedding`.
//
// Real triggers:
//   - runMatchScore: on apply (actions/apply.ts, inside after(), once the
//     application row is created). It reuses embedJobPost as a lazy fallback
//     for jobs that somehow still lack an embedding.
//   - embedJobPost: on JD publish + on edits that change the JD text
//     (actions/post-job.ts, inside after()), and from the algolia-reconcile
//     cron's sweep over published jobs with a NULL embedding.

import { embed } from 'ai';
import { gateway, MODELS } from '@/lib/ai/gateway';
import { db } from '@/lib/db';
import { logger } from '@/lib/observability/logger';

export type MatchScoreInput = { jobPostId: string; jobSeekerId: string };

type EmbeddingRow = { embedding: number[] | null };

// Embed a job post's JD text (title + description + requirements) and persist
// it to `job_posts.embedding` (pgvector, raw SQL — Unsupported() column).
// Idempotent by default: an existing embedding is returned untouched. There is
// no stored source-text hash, so callers that know the JD text changed (the
// updateJob action) pass { force: true } to regenerate. Returns the embedding,
// or null when the job no longer exists.
export async function embedJobPost(
  jobPostId: string,
  { force = false }: { force?: boolean } = {},
): Promise<number[] | null> {
  if (!force) {
    const existing = await db.$queryRaw<EmbeddingRow[]>`
      SELECT embedding::float8[] AS embedding FROM job_posts WHERE id = ${jobPostId}::uuid LIMIT 1
    `;
    const current = existing[0]?.embedding;
    if (current) return current;
  }

  const job = await db.jobPost.findUnique({
    where: { id: jobPostId },
    select: { title: true, description: true, requirements: true },
  });
  if (!job) return null;

  const text = `${job.title}\n\n${job.description}\n\n${job.requirements ?? ''}`.slice(0, 30_000);
  const { embedding } = await embed({
    model: gateway.textEmbeddingModel(MODELS.embeddingLarge),
    value: text,
  });

  const literal = `[${embedding.join(',')}]`;
  await db.$executeRaw`
    UPDATE job_posts SET embedding = ${literal}::vector WHERE id = ${jobPostId}::uuid
  `;

  return embedding;
}

export async function runMatchScore({
  jobPostId,
  jobSeekerId,
}: MatchScoreInput): Promise<number | null> {
  // Resume embedding lookup
  const resumeRow = await db.$queryRaw<EmbeddingRow[]>`
    SELECT embedding::float8[] AS embedding
      FROM resumes
     WHERE "userId" = ${jobSeekerId}::uuid
       AND "deletedAt" IS NULL
       AND embedding IS NOT NULL
  ORDER BY "createdAt" DESC
     LIMIT 1
  `;
  const resumeEmbedding = resumeRow[0]?.embedding;
  if (!resumeEmbedding) {
    logger.info({ jobSeekerId }, 'no resume embedding yet; skipping match score');
    return null;
  }

  // JD embedding lookup (or compute + persist) — shared with the publish/edit
  // and reconcile-sweep call sites.
  const jobEmbedding = await embedJobPost(jobPostId);
  if (!jobEmbedding) return null;

  const score = cosine(resumeEmbedding, jobEmbedding);

  // Persist on the application row if it exists. Idempotent: re-running won't
  // change a score that's already correct.
  await db.jobApplication.updateMany({
    where: { jobPostId, jobSeekerId },
    data: { matchScore: score },
  });

  return score;
}

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('embedding length mismatch');
  let dot = 0;
  let aMag = 0;
  let bMag = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    aMag += av * av;
    bMag += bv * bv;
  }
  if (aMag === 0 || bMag === 0) return 0;
  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}
