import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { tags } from '@/lib/cache';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return { title: 'Company not found' };
  return {
    title: company.companyName,
    description: company.description.slice(0, 160),
  };
}

export default async function CompanyDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const openJobs = await db.jobPost.findMany({
    where: { companyId: company.userId, status: 'PUBLISHED', deletedAt: null },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  return (
    <main style={{ padding: '3rem 2rem', maxWidth: 960, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        {company.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt="" width={72} height={72} style={{ borderRadius: 12, objectFit: 'cover' }} />
        )}
        <div>
          <h1 style={{ margin: 0 }}>{company.companyName}</h1>
          <p style={{ margin: 0, color: '#555' }}>
            {company.industry.replace('_', ' ')} · {company.companySize.replace('_', ' ').toLowerCase()}
          </p>
        </div>
      </header>

      <article style={{ lineHeight: 1.6, color: '#222', whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>
        {company.description}
      </article>

      {company.website && (
        <p>
          <a href={company.website} rel="noopener noreferrer" target="_blank">
            {company.website}
          </a>
        </p>
      )}

      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>Open positions</h2>
        {openJobs.length === 0 ? (
          <p style={{ color: '#888' }}>No open positions right now.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {openJobs.map((job) => (
              <li key={job.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
                <Link href={`/jobs/${job.slug}`}>
                  <strong>{job.title}</strong>
                </Link>
                {job.location && <span style={{ color: '#666' }}> · {job.location}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

async function getCompanyBySlug(slug: string) {
  'use cache';
  const { cacheTag, cacheLife } = await import('next/cache');
  cacheLife('hours');

  const profile = await db.companyProfile.findUnique({ where: { slug } });
  if (!profile) return null;

  cacheTag(tags.company(profile.userId));
  return profile;
}
