import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { tags } from '@/lib/cache';
import { Container } from '@/app/components/ui/container';
import { Card } from '@/app/components/ui/card';

export const metadata = {
  title: 'Find your next role',
  description: 'Search thousands of jobs from vetted companies. Apply in one click.',
};

export default function MarketingHomePage() {
  return (
    <main>
      <section className="border-b border-neutral-200 bg-gradient-to-b from-neutral-50 to-white">
        <Container className="py-20">
          <h1 className="m-0 max-w-2xl text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            Find your next role
          </h1>
          <p className="mt-4 max-w-xl text-lg text-neutral-600">
            Search jobs by skill, location, and salary. Apply in one click with an AI-parsed résumé.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/jobs"
              className="inline-block rounded-lg bg-neutral-900 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              Browse jobs
            </Link>
            <Link
              href="/employer-setup"
              className="inline-block rounded-lg border border-neutral-300 bg-white px-5 py-2.5 font-semibold text-neutral-900 transition-colors hover:bg-neutral-50"
            >
              Post a job
            </Link>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <h2 className="mb-4 text-2xl font-bold text-neutral-900">Featured jobs</h2>
        <Suspense fallback={<p className="text-neutral-500">Loading featured jobs…</p>}>
          <FeaturedJobs />
        </Suspense>
      </Container>
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
    return <p className="text-neutral-500">No jobs posted yet. Check back soon.</p>;
  }

  return (
    <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <li key={job.id}>
          <Link href={`/jobs/${job.slug}`} className="block">
            <Card className="h-full transition-shadow hover:shadow-md">
              <h3 className="m-0 font-semibold text-neutral-900">{job.title}</h3>
              <p className="mt-1 mb-0 text-sm text-neutral-600">
                {job.company.companyProfile?.companyName ?? 'Company'}
                {job.location ? ` · ${job.location}` : ''}
              </p>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
