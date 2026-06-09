import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { tags } from '@/lib/cache';
import { Container } from '@/app/components/ui/container';
import { Card } from '@/app/components/ui/card';
import { GlobeLazy } from '@/app/components/globe-lazy';

export const metadata = {
  title: 'Find your next role',
  description: 'Search thousands of jobs from vetted companies. Apply in one click.',
};

export default function MarketingHomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-neutral-200">
        {/* Ambient "canvas" backdrop — gradient wash + faded grid + colored
            starfield, all CSS (no image asset). Inspired by the-drop hero. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, oklch(0.972 0.032 280) 0%, oklch(0.995 0.005 272) 50%, oklch(0.965 0.035 235) 100%)',
            }}
          />
          {/* soft aurora blobs — cohesive violet → indigo → sky */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(42% 55% at 16% 18%, oklch(0.70 0.18 288 / 0.20), transparent 70%), radial-gradient(46% 52% at 88% 26%, oklch(0.72 0.16 258 / 0.18), transparent 72%), radial-gradient(44% 48% at 72% 100%, oklch(0.78 0.13 228 / 0.14), transparent 72%)',
            }}
          />
          {/* grid, masked to fade toward the edges */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(oklch(0.45 0.05 272 / 0.07) 1px, transparent 1px), linear-gradient(90deg, oklch(0.45 0.05 272 / 0.07) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              maskImage: 'radial-gradient(ellipse 78% 68% at 50% 28%, #000 32%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 78% 68% at 50% 28%, #000 32%, transparent 80%)',
            }}
          />
          {/* colored starfield — violet / indigo / sky */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(1.5px 1.5px at 20% 26%, oklch(0.52 0.14 288 / 0.40), transparent 50%), radial-gradient(1.5px 1.5px at 62% 16%, oklch(0.55 0.13 258 / 0.35), transparent 50%), radial-gradient(2px 2px at 81% 60%, oklch(0.58 0.12 228 / 0.32), transparent 50%), radial-gradient(1.5px 1.5px at 38% 70%, oklch(0.52 0.14 288 / 0.30), transparent 50%), radial-gradient(1.5px 1.5px at 91% 36%, oklch(0.55 0.13 258 / 0.33), transparent 50%), radial-gradient(1.5px 1.5px at 8% 64%, oklch(0.58 0.12 228 / 0.28), transparent 50%)',
            }}
          />
        </div>

        <Container className="relative py-24 sm:py-28 lg:py-32">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-900/10 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                AI-matched roles · apply in one click
              </span>

              {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
              <img src="/logo.png" alt="Joblify" width={56} height={56} className="mt-6 size-14 rounded-xl shadow-sm" />

              <h1 className="mt-5 max-w-2xl text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                Find your next role
              </h1>
              <p className="mt-4 max-w-xl text-lg text-neutral-600">
                Search jobs by skill, location, and salary. Apply in one click with an AI-parsed résumé.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/jobs"
                  className="inline-block rounded-lg bg-neutral-900 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-neutral-700"
                >
                  Browse jobs
                </Link>
                <Link
                  href="/employer-setup"
                  className="inline-block rounded-lg border border-neutral-300 bg-white/80 px-5 py-2.5 font-semibold text-neutral-900 backdrop-blur-sm transition-colors hover:bg-white"
                >
                  Post a job
                </Link>
              </div>
            </div>

            {/* Global map simulation — auto-rotating dotted globe */}
            <div className="relative">
              <GlobeLazy />
            </div>
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
