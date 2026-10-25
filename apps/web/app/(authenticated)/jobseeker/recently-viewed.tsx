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
    <section className="mt-5 mb-6">
      <h2 className="text-fg-muted mb-2 text-[12px] font-semibold tracking-wider uppercase">
        Recently viewed
      </h2>
      <div className="flex gap-2.5 overflow-x-auto pb-2">
        {jobs.map((j) => (
          <Link
            key={j.slug}
            href={`/jobs/${j.slug}`}
            className="rounded-card border-border bg-surface hover:border-border-strong block w-56 shrink-0 border px-3 py-2.5 no-underline transition-colors"
          >
            <strong className="text-fg block truncate text-[13px] font-medium">{j.title}</strong>
            <span className="text-fg-muted block truncate text-[12px]">{j.company}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
