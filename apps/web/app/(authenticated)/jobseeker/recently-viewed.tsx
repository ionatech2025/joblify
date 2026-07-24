import Link from 'next/link';
import { db } from '@/lib/db';

// Most-recently-viewed distinct jobs for a jobseeker. Over-fetches recent views
// and dedupes in JS (avoids Prisma's distinct+orderBy ON-column constraint).
export async function RecentlyViewed({ userId }: { userId: string }) {
  const rows = await db.jobView.findMany({
    where: { userId, jobPost: { status: 'PUBLISHED', deletedAt: null } },
    orderBy: { createdAt: 'desc' },
    take: 40,
    select: {
      jobPostId: true,
      jobPost: {
        select: {
          slug: true,
          title: true,
          company: { select: { companyProfile: { select: { companyName: true } } } },
        },
      },
    },
  });

  const seen = new Set<string>();
  const jobs: { slug: string; title: string; company: string }[] = [];
  for (const r of rows) {
    if (seen.has(r.jobPostId)) continue;
    seen.add(r.jobPostId);
    jobs.push({
      slug: r.jobPost.slug,
      title: r.jobPost.title,
      company: r.jobPost.company.companyProfile?.companyName ?? 'Company',
    });
    if (jobs.length === 6) break;
  }

  if (jobs.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-base font-semibold text-neutral-900">Recently viewed</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {jobs.map((j) => (
          <Link
            key={j.slug}
            href={`/jobs/${j.slug}`}
            className="block w-56 shrink-0 rounded-2xl border border-neutral-200/80 bg-white p-3 no-underline shadow-soft transition-shadow hover:shadow-md"
          >
            <strong className="block text-sm text-neutral-900">{j.title}</strong>
            <span className="text-sm text-neutral-600">{j.company}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
