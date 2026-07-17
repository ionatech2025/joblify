import { db } from '@/lib/db';

export type RecommendedJob = {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  location: string | null;
  workMode: string;
  similarity: number;
};

type MatchRow = { id: string; similarity: number };

// The resume/job-post embeddings already power the per-application match
// score (workflows/match-score.workflow.ts) but nothing surfaces them for
// discovery. This reuses the same HNSW-indexed columns for a nearest-neighbor
// query instead — "jobs like what you're good at" rather than a 1:1 score.
// Returns [] gracefully when the jobseeker has no resume with an embedding
// yet (the LATERAL join simply yields no rows).
export async function getRecommendedJobs(jobSeekerUserId: string, limit = 10): Promise<RecommendedJob[]> {
  const ranked = await db.$queryRaw<MatchRow[]>`
    SELECT jp.id, 1 - (jp.embedding <=> r.embedding) AS similarity
      FROM job_posts jp
      CROSS JOIN LATERAL (
        SELECT embedding
          FROM resumes
         WHERE "userId" = ${jobSeekerUserId}::uuid
           AND "deletedAt" IS NULL
           AND embedding IS NOT NULL
      ORDER BY "createdAt" DESC
         LIMIT 1
      ) r
     WHERE jp.status = 'PUBLISHED'
       AND jp."deletedAt" IS NULL
       AND jp.embedding IS NOT NULL
  ORDER BY jp.embedding <=> r.embedding
     LIMIT ${limit}
  `;
  if (ranked.length === 0) return [];

  const jobs = await db.jobPost.findMany({
    where: { id: { in: ranked.map((r) => r.id) } },
    select: {
      id: true,
      slug: true,
      title: true,
      location: true,
      workMode: true,
      company: { select: { companyProfile: { select: { companyName: true } } } },
    },
  });
  const byId = new Map(jobs.map((j) => [j.id, j]));

  return ranked
    .map((r): RecommendedJob | null => {
      const job = byId.get(r.id);
      if (!job) return null;
      return {
        id: job.id,
        slug: job.slug,
        title: job.title,
        companyName: job.company.companyProfile?.companyName ?? 'Company',
        location: job.location,
        workMode: job.workMode,
        similarity: r.similarity,
      };
    })
    .filter((j): j is RecommendedJob => j !== null);
}
