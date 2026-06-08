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
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Recently viewed</h2>
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {jobs.map((j) => (
          <Link
            key={j.slug}
            href={`/jobs/${j.slug}`}
            style={{
              flex: '0 0 220px',
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              padding: '0.75rem 0.9rem',
              color: 'inherit',
              textDecoration: 'none',
              display: 'block',
            }}
          >
            <strong style={{ display: 'block', fontSize: '0.92rem' }}>{j.title}</strong>
            <span style={{ color: '#666', fontSize: '0.85rem' }}>{j.company}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
