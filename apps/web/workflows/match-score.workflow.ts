// Vercel Workflow: compute a (resume, jobPost) semantic match score.
//
// Strategy: cosine similarity of pre-computed embeddings. The resume
// embedding is written by resume-parse.workflow.ts; the JD embedding is
// written here lazily and cached in `job_posts.embedding`.
//
// Triggered:
//   - on apply (from actions/apply.ts after the application row is created)
//   - on JD publish (best-effort, so authenticated browsers see the match
//     badge on /jobs/[slug] without a delay)

import { embed } from 'ai';
import { gateway, MODELS } from '@/lib/ai/gateway';
import { db } from '@/lib/db';
import { logger } from '@/lib/observability/logger';

export type MatchScoreInput = { jobPostId: string; jobSeekerId: string };

type EmbeddingRow = { embedding: number[] | null };

export async function runMatchScore({ jobPostId, jobSeekerId }: MatchScoreInput): Promise<number | null> {
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

  // JD embedding lookup (or compute + persist)
  const jobRow = await db.$queryRaw<EmbeddingRow[]>`
    SELECT embedding::float8[] AS embedding FROM job_posts WHERE id = ${jobPostId}::uuid LIMIT 1
  `;
  let jobEmbedding = jobRow[0]?.embedding ?? null;

  if (!jobEmbedding) {
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
    jobEmbedding = embedding;

    const literal = `[${embedding.join(',')}]`;
    await db.$executeRaw`
      UPDATE job_posts SET embedding = ${literal}::vector WHERE id = ${jobPostId}::uuid
    `;
  }

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
