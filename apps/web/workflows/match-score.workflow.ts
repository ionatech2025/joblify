// Compute a (resume, jobPost) semantic match score. Plain inline function —
// no durable-execution runtime; callers invoke it off the response path via
// Next's `after()` and failures are logged, never retried in-place.
//
// Strategy: cosine similarity of pre-computed embeddings. The resume
// embedding is written by resume-parse.workflow.ts; the JD embedding is
// written by embedJobPost() below and cached in `job_posts.embedding`.
//
// The score is an AI-assisted signal shown to recruiters, so it carries its
// provenance: `JobApplication.matchModel` / `matchScoredAt` record which
// embedding model produced it and when. Vectors from different models are not
// comparable, so a score is only computed when the resume and job embeddings
// came from the SAME (current) model — otherwise the stale side is re-embedded
// or the score is skipped, never computed across a model boundary.
//
// Real triggers:
//   - runMatchScore: on apply (actions/apply.ts, inside after(), once the
//     application row is created). It reuses embedJobPost as a lazy fallback
//     for jobs that somehow still lack an embedding.
//   - embedJobPost: on JD publish + on edits that change the JD text
//     (actions/post-job.ts, inside after()), and from the algolia-reconcile
//     cron's sweep over published jobs with a NULL (or stale-model) embedding.

import { embedText, toVectorLiteral } from '@/lib/ai/embeddings';
import { MODELS } from '@/lib/ai/gateway';
import { db } from '@/lib/db';
import { logger } from '@/lib/observability/logger';

export type MatchScoreInput = {
  jobPostId: string;
  jobSeekerId: string;
  /**
   * The résumé submitted with the application. When given, THAT résumé is
   * scored. When omitted the candidate's newest résumé is used — which is only
   * right at apply time: re-scoring an old application against whatever the
   * candidate uploaded later puts a number on screen that does not describe
   * the document the employer actually received.
   */
  resumeId?: string;
};

type EmbeddingRow = { embedding: number[] | null; embeddingModel?: string | null };

// Embed a job post's JD text (title + description + requirements) and persist
// it to `job_posts.embedding` (pgvector, raw SQL — Unsupported() column).
// Idempotent by default: an existing embedding from the CURRENT model is
// returned untouched. There is no stored source-text hash, so callers that
// know the JD text changed (the updateJob action) pass { force: true } to
// regenerate. Returns the embedding, or null when the job no longer exists.
export async function embedJobPost(
  jobPostId: string,
  { force = false }: { force?: boolean } = {},
): Promise<number[] | null> {
  if (!force) {
    const existing = await db.$queryRaw<EmbeddingRow[]>`
      SELECT embedding::float8[] AS embedding, "embeddingModel" AS "embeddingModel"
        FROM job_posts WHERE id = ${jobPostId}::uuid LIMIT 1
    `;
    const current = existing[0]?.embedding;
    // A vector from a retired model is not comparable with a fresh resume
    // vector — treat it as missing and recompute.
    if (current && existing[0]?.embeddingModel === MODELS.embedding) return current;
  }

  const job = await db.jobPost.findUnique({
    where: { id: jobPostId },
    select: { title: true, description: true, requirements: true },
  });
  if (!job) return null;

  const text = `${job.title}\n\n${job.description}\n\n${job.requirements ?? ''}`;
  const { embedding, model } = await embedText(text);

  await db.$executeRaw`
    UPDATE job_posts
       SET embedding = ${toVectorLiteral(embedding)}::vector,
           "embeddingModel" = ${model}
     WHERE id = ${jobPostId}::uuid
  `;

  return embedding;
}

export async function runMatchScore({
  jobPostId,
  jobSeekerId,
  resumeId,
}: MatchScoreInput): Promise<number | null> {
  // Resume embedding lookup. A submitted résumé is scored even if its owner has
  // since deleted it (the employer still holds that copy).
  const resumeRow = resumeId
    ? await db.$queryRaw<EmbeddingRow[]>`
        SELECT embedding::float8[] AS embedding, "embeddingModel" AS "embeddingModel"
          FROM resumes
         WHERE id = ${resumeId}::uuid
           AND "userId" = ${jobSeekerId}::uuid
           AND embedding IS NOT NULL
         LIMIT 1
      `
    : await db.$queryRaw<EmbeddingRow[]>`
        SELECT embedding::float8[] AS embedding, "embeddingModel" AS "embeddingModel"
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
  if (resumeRow[0]?.embeddingModel !== MODELS.embedding) {
    // Produced by an older model; the AI sweep re-embeds it. Comparing it to a
    // current-model job vector would yield a number with no meaning.
    logger.info({ jobSeekerId }, 'resume embedding is from a retired model; skipping match score');
    return null;
  }

  // JD embedding lookup (or compute + persist) — shared with the publish/edit
  // and reconcile-sweep call sites.
  const jobEmbedding = await embedJobPost(jobPostId);
  if (!jobEmbedding) return null;

  const score = cosine(resumeEmbedding, jobEmbedding);

  // Persist on the application row if it exists. Idempotent: re-running won't
  // change a score that's already correct (the timestamp refreshes).
  await db.jobApplication.updateMany({
    where: { jobPostId, jobSeekerId },
    data: { matchScore: score, matchModel: MODELS.embedding, matchScoredAt: new Date() },
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
