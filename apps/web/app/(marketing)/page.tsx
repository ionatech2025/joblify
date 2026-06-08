import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { tags } from '@/lib/cache';

export const metadata = {
  title: 'Find your next role',
  description: 'Search thousands of jobs from vetted companies. Apply in one click.',
};

export default function MarketingHomePage() {
  return (
    <main>
      <section style={{ padding: '4rem 2rem', maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Find your next role</h1>
        <p style={{ fontSize: '1.125rem', color: '#555' }}>
          Search jobs by skill, location, and salary. Apply in one click with an AI-parsed resume.
        </p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <Link href="/jobs" style={btn('primary')}>
            Browse jobs
          </Link>
          <Link href="/sign-up" style={btn('secondary')}>
            Post a job
          </Link>
        </div>
      </section>

      <section style={{ padding: '2rem', maxWidth: 1080, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Featured jobs</h2>
        <Suspense fallback={<p>Loading featured jobs…</p>}>
          <FeaturedJobs />
        </Suspense>
      </section>
    </main>
  );
}

// 'use cache' with cacheLife('hours') — invalidated by Server Actions on
// post-job / status-change via updateTag('jobs').
async function getFeaturedJobs() {
  'use cache';
  const { cacheTag, cacheLife } = await import('next/cache');
  cacheTag(tags.jobs());
  cacheLife('hours');

  return db.jobPost.findMany({
    where: { status: 'PUBLISHED', deletedAt: null },
    orderBy: { publishedAt: 'desc' },
    take: 6,
    include: { company: { include: { companyProfile: true } } },
  });
}

async function FeaturedJobs() {
  // Dynamic boundary: defers to runtime (streamed via the Suspense above) so the
  // build needs no database. getFeaturedJobs() still caches the query at runtime.
  await connection();
  const jobs = await getFeaturedJobs();

  if (jobs.length === 0) {
    return <p style={{ color: '#888' }}>No jobs posted yet. Check back soon.</p>;
  }

  return (
    <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', listStyle: 'none', padding: 0 }}>
      {jobs.map((job) => (
        <li key={job.id} style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: '1rem' }}>
          <Link href={`/jobs/${job.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ margin: '0 0 0.25rem' }}>{job.title}</h3>
            <p style={{ margin: 0, color: '#666' }}>
              {job.company.companyProfile?.companyName ?? 'Company'}
              {job.location ? ` · ${job.location}` : ''}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function btn(variant: 'primary' | 'secondary'): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '0.75rem 1.25rem',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 600,
    display: 'inline-block',
  };
  if (variant === 'primary') return { ...base, background: '#111', color: 'white' };
  return { ...base, background: '#f1f1f1', color: '#111' };
}
