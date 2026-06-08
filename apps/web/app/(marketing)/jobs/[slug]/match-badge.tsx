import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// Match badge — server-rendered, only for authenticated jobseekers who have
// at least one resume parsed. Pulls from the precomputed `match_score`
// pgvector cosine (lib/query precomputed on apply, plus a passive prefetch
// when an authenticated jobseeker hits the JD page).
//
// Reads only — no AI Gateway call on the hot path.

export async function MatchBadge({ jobId }: { jobId: string }) {
  const user = await currentUser();
  if (!user || user.userType !== 'JOB_SEEKER') return null;

  // First: look up an existing application with score.
  const application = await db.jobApplication.findUnique({
    where: { jobPostId_jobSeekerId: { jobPostId: jobId, jobSeekerId: user.id } },
    select: { matchScore: true },
  });

  let score = application?.matchScore ?? null;

  // Second: passive compute if we have both embeddings already and no score.
  if (score === null) {
    score = await computeMatchIfEmbeddingsExist(jobId, user.id);
  }

  if (score === null) return null;

  const pct = Math.round(score * 100);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: pct >= 70 ? '#cdeacd' : pct >= 50 ? '#fff3cd' : '#f5d9d4',
        color: pct >= 70 ? '#114411' : pct >= 50 ? '#664400' : '#8a2a1f',
        borderRadius: 999,
        fontWeight: 600,
        fontSize: '0.85rem',
      }}
      aria-label={`Match score ${pct} percent`}
    >
      Match: {pct}%
    </div>
  );
}

async function computeMatchIfEmbeddingsExist(jobId: string, userId: string): Promise<number | null> {
  // Inline cheap path — only if both embeddings already exist. Heavy compute
  // (creating embeddings) is workflow-triggered.
  const result = await db.$queryRaw<{ score: number | null }[]>`
    WITH r AS (
      SELECT embedding
        FROM resumes
       WHERE "userId" = ${userId}::uuid
         AND embedding IS NOT NULL
         AND "deletedAt" IS NULL
    ORDER BY "createdAt" DESC
       LIMIT 1
    ),
    j AS (
      SELECT embedding FROM job_posts WHERE id = ${jobId}::uuid AND embedding IS NOT NULL
    )
    SELECT 1 - (r.embedding <=> j.embedding) AS score
      FROM r, j
  `;

  return result[0]?.score ?? null;
}
