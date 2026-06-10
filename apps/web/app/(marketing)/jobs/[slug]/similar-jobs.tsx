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
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-neutral-900">Similar jobs</h2>
      <ul className="grid list-none grid-cols-1 gap-2 p-0">
        {jobs.map((j) => (
          <li key={j.id} className="rounded-lg border border-neutral-200 px-4 py-3">
            <Link href={`/jobs/${j.slug}`} className="text-neutral-900 no-underline">
              <strong>{j.title}</strong>
              <span className="text-neutral-600">
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
