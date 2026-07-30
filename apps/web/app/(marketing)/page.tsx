import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { tags } from '@/lib/cache';
import { ArrowRight, Briefcase, Sparkles } from 'lucide-react';
import { Container } from '@/app/components/ui/container';
import { Card } from '@/app/components/ui/card';
import { EmptyState } from '@/app/components/ui/empty-state';
import { Sparkline } from '@/app/components/ui/sparkline';
import { Skeleton, SkeletonList } from '@/app/components/ui/skeleton';
import { IslandBoundary } from '@/app/components/island-boundary';
import { Badge } from '@/app/components/ui/badge';
import { Stat, StatRow } from '@/app/components/ui/stat';
import { buttonClasses } from '@/app/components/ui/button';
import { AmbientCanvas } from '@/app/components/ui/ambient';
import { GlobeLazy } from '@/app/components/globe-lazy';

export const metadata = {
  title: 'Find your next role',
  description: 'Search thousands of jobs from vetted companies. Apply in one click.',
};

export default function MarketingHomePage() {
  return (
    <main>
      <section className="pt-6 sm:pt-8">
        <Container>
          {/* Rounded inset hero canvas: the shared ambient language wrapped in a
              large radius panel, with paired pill CTAs and floating glass stats. */}
          <div className="relative overflow-hidden rounded-canvas border border-border shadow-soft">
            <AmbientCanvas variant="hero" />

            <div className="relative grid items-center gap-10 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:px-14 lg:py-24">
              <div>
                <p className="eyebrow m-0">
                  <Sparkles aria-hidden className="size-3.5" />
                  AI-powered job search
                </p>

                <h1 className="display m-0 mt-4 max-w-2xl text-4xl text-fg uppercase sm:text-6xl lg:text-7xl">
                  Find your next role
                </h1>
                <p className="mt-5 mb-0 max-w-xl text-lg text-fg-muted">
                  Search jobs by skill, location, and salary. Apply in one click with an AI-parsed
                  résumé.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/jobs" className={`${buttonClasses('primary', 'lg')} no-underline`}>
                    Browse jobs
                    {/* Arrow-in-circle: the primary-CTA affordance from the
                        reference set. Decorative — the label carries meaning. */}
                    <span
                      aria-hidden
                      className="bg-ink-fg/15 -mr-2 grid size-6 place-items-center rounded-full"
                    >
                      <ArrowRight className="size-3.5" />
                    </span>
                  </Link>
                  <Link
                    href="/employer-setup"
                    className={`${buttonClasses('secondary', 'lg')} no-underline`}
                  >
                    Post a job
                  </Link>
                </div>
                <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-xs font-medium text-fg-muted shadow-sm backdrop-blur-md">
                  <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                  AI-matched roles · apply in one click
                </span>
              </div>

              {/* Global map simulation — auto-rotating dotted globe, with
                  floating glass stat cards over it on large screens. */}
              {/* Each island gets its own error boundary: these are secondary,
                  and without one a failed query propagates to error.tsx and
                  replaces the entire page — hero, CTAs and all. */}
              <div className="relative">
                <GlobeLazy />
                <IslandBoundary fallback={null}>
                  <Suspense fallback={null}>
                    <HeroStatCards />
                  </Suspense>
                </IslandBoundary>
              </div>
            </div>
          </div>

          <IslandBoundary fallback={null}>
            <Suspense fallback={<HeroStatRowSkeleton />}>
              <HeroStatRow />
            </Suspense>
          </IslandBoundary>
        </Container>
      </section>

      <Container className="pt-2 pb-16 sm:pb-20">
        <p className="eyebrow m-0">Fresh on Joblify</p>
        <h2 className="display m-0 mt-2 mb-6 text-2xl text-fg sm:text-3xl">Featured jobs</h2>
        <IslandBoundary
          fallback={
            <EmptyState
              icon={<Briefcase />}
              title="Couldn’t load featured jobs"
              description="Search is still available — browse everything that’s open right now."
              action={
                <Link href="/jobs" className={`${buttonClasses()} no-underline`}>
                  Browse all jobs
                </Link>
              }
            />
          }
        >
          <Suspense fallback={<SkeletonList count={3} />}>
            <FeaturedJobs />
          </Suspense>
        </IslandBoundary>
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
    include: {
      company: { include: { companyProfile: true } },
      skills: { include: { skill: true }, take: 4 },
    },
  });
}

// Marketplace counts for the hero stat cards + stat row. Same caching contract
// as getFeaturedJobs: 'use cache' + cacheLife('hours'), invalidated via the
// jobs/companies tag namespaces when posts publish or companies verify.
async function getMarketplaceStats() {
  'use cache';
  const { cacheTag, cacheLife } = await import('next/cache');
  cacheTag(tags.jobs(), tags.companies());
  cacheLife('hours');

  // Six whole months back, from the start of that month.
  const since = new Date();
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCMonth(since.getUTCMonth() - 5);

  const [openRoles, companiesHiring, skillsTracked, published] = await Promise.all([
    db.jobPost.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
    db.companyProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
    db.skill.count(),
    // Bucketed in JS rather than a date_trunc raw query: one indexed column,
    // one index ([status, publishedAt desc]), and the result is cached hourly.
    db.jobPost.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, publishedAt: { gte: since } },
      select: { publishedAt: true },
    }),
  ]);

  // Real monthly counts for the hero sparkline — never synthesised, so an empty
  // marketplace renders a flat line rather than an invented trend.
  const openRolesTrend = Array.from({ length: 6 }, (_, i) => {
    const start = new Date(since);
    start.setUTCMonth(since.getUTCMonth() + i);
    const end = new Date(start);
    end.setUTCMonth(start.getUTCMonth() + 1);
    return published.filter((j) => j.publishedAt && j.publishedAt >= start && j.publishedAt < end)
      .length;
  });

  return { openRoles, companiesHiring, skillsTracked, openRolesTrend };
}

// Floating glass stat cards over the globe column (lg+ only). Decorative
// duplicates of the stat row below, so hidden from assistive tech.
async function HeroStatCards() {
  // Dynamic boundary: defers to runtime (streamed via the Suspense above) so
  // the build needs no database; getMarketplaceStats() caches at runtime.
  await connection();
  const stats = await getMarketplaceStats();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
      <Card tone="glass" className="absolute top-2 -right-2 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <p className="display m-0 text-2xl text-fg">{stats.openRoles.toLocaleString('en-US')}</p>
          {/* Real monthly publish counts — see getMarketplaceStats(). */}
          <Sparkline values={stats.openRolesTrend} className="mt-1.5" />
        </div>
        <p className="caption m-0 mt-1">Open roles</p>
      </Card>
      <Card tone="glass" className="absolute bottom-6 -left-2 px-5 py-4">
        <p className="display m-0 text-2xl text-fg">
          {stats.companiesHiring.toLocaleString('en-US')}
        </p>
        <p className="caption m-0 mt-1">Companies hiring</p>
      </Card>
    </div>
  );
}

// Social-proof stat row beneath the hero panel — real cached counts.
async function HeroStatRow() {
  await connection();
  const stats = await getMarketplaceStats();

  return (
    <StatRow divided className="px-2 py-10 sm:py-12">
      <Stat
        value={stats.openRoles.toLocaleString('en-US')}
        label="Open roles"
        chart={
          <Sparkline
            values={stats.openRolesTrend}
            label="Roles published per month, last 6 months"
          />
        }
      />
      <Stat value={stats.companiesHiring.toLocaleString('en-US')} label="Companies hiring" />
      <Stat value={stats.skillsTracked.toLocaleString('en-US')} label="Skills tracked" />
    </StatRow>
  );
}

function HeroStatRowSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-2 gap-6 px-2 py-10 sm:grid-cols-3 sm:gap-10 sm:py-12"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className={i === 2 ? 'hidden sm:block' : ''}>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

async function FeaturedJobs() {
  // Dynamic boundary: defers to runtime (streamed via the Suspense above) so the
  // build needs no database. getFeaturedJobs() still caches the query at runtime.
  await connection();
  const jobs = await getFeaturedJobs();

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase />}
        title="No jobs posted yet"
        description="New roles appear here as companies publish them. Be the first to post one."
        action={
          <Link href="/employer-setup" className={`${buttonClasses()} no-underline`}>
            Post a job
          </Link>
        }
      />
    );
  }

  return (
    <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <li key={job.id}>
          <Link href={`/jobs/${job.slug}`} className="block h-full no-underline">
            <Card className="flex h-full flex-col gap-3 transition-shadow hover:shadow-md">
              <div>
                <h3 className="m-0 text-base font-semibold text-fg">{job.title}</h3>
                <p className="mt-1 mb-0 text-sm text-fg-muted">
                  {job.company.companyProfile?.companyName ?? 'Company'}
                  {job.location ? ` · ${job.location}` : ''}
                </p>
              </div>
              {job.salaryMin && job.salaryMax ? (
                <Badge tone="dark" className="self-start">
                  {job.salaryCurrency} {job.salaryMin.toLocaleString('en-US')}–
                  {job.salaryMax.toLocaleString('en-US')}
                </Badge>
              ) : null}
              {job.skills.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {job.skills.map((js) => (
                    <Badge key={js.skillId} tone="neutral">
                      {js.skill.label}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
