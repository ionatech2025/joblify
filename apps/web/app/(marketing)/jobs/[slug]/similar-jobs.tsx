import Link from 'next/link';
import type { IndustryType } from '@prisma/client';
import { db } from '@/lib/db';
import { Card } from '@/app/components/ui/card';

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
      <p className="eyebrow m-0">More like this</p>
      <h2 className="display m-0 mt-2 mb-4 text-2xl text-neutral-900">Similar jobs</h2>
      <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
        {jobs.map((j) => (
          <li key={j.id}>
            <Link href={`/jobs/${j.slug}`} className="block h-full no-underline">
              <Card className="h-full transition-shadow hover:shadow-md">
                <h3 className="m-0 text-base font-semibold text-neutral-900">{j.title}</h3>
                <p className="mt-1 mb-0 text-sm text-neutral-600">
                  {j.company.companyProfile?.companyName ?? 'Company'}
                  {j.location ? ` · ${j.location}` : ''}
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
