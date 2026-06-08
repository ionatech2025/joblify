import Link from 'next/link';
import type { IndustryType } from '@prisma/client';
import { db } from '@/lib/db';

// Dynamic island under the cached JD shell: other live jobs that share skills
// with this one (falling back to the same industry), newest first.
export async function SimilarJobs({
  jobId,
  industry,
  skillIds,
}: {
  jobId: string;
  industry: IndustryType;
  skillIds: string[];
}) {
  const jobs = await db.jobPost.findMany({
    where: {
      id: { not: jobId },
      status: 'PUBLISHED',
      deletedAt: null,
      ...(skillIds.length
        ? { OR: [{ skills: { some: { skillId: { in: skillIds } } } }, { industry }] }
        : { industry }),
    },
    orderBy: { publishedAt: 'desc' },
    take: 4,
    select: {
      id: true,
      slug: true,
      title: true,
      location: true,
      company: { select: { companyProfile: { select: { companyName: true } } } },
    },
  });

  if (jobs.length === 0) return null;

  return (
    <section style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.25rem' }}>Similar jobs</h2>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
        {jobs.map((j) => (
          <li key={j.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '0.75rem 1rem' }}>
            <Link href={`/jobs/${j.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              <strong>{j.title}</strong>
              <span style={{ color: '#666' }}>
                {' — '}
                {j.company.companyProfile?.companyName ?? 'Company'}
                {j.location ? ` · ${j.location}` : ''}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
