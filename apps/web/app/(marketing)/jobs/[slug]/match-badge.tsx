import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// Match badge — server-rendered, only for authenticated jobseekers who have
// at least one resume parsed. Pulls from the precomputed match score; reads
// only — no AI Gateway call on the hot path.
export async function MatchBadge({ jobId }: { jobId: string }) {
  const user = await currentUser();
  if (!user || user.userType !== 'JOB_SEEKER') return null;

  const application = await db.jobApplication.findUnique({
    where: { jobPostId_jobSeekerId: { jobPostId: jobId, jobSeekerId: user.id } },
    select: { matchScore: true },
  });

  let score = application?.matchScore ?? null;
  if (score === null) {
    score = await computeMatchIfEmbeddingsExist(jobId, user.id);
  }
  if (score === null) return null;

  const pct = Math.round(score * 100);
  const tone =
    pct >= 70 ? 'bg-green-100 text-green-800' : pct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${tone}`}
      aria-label={`Match score ${pct} percent`}
    >
      Match: {pct}%
    </span>
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
