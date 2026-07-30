import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import type { JobType } from '@prisma/client';
import { db } from '@/lib/db';
import { tags } from '@/lib/cache';
import { jobPostingJsonLd } from '@/lib/seo/job-jsonld';
import { META_CHIP } from '@/lib/ui/status';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';
import { AmbientBand } from '@/app/components/ui/ambient';
import { IslandBoundary } from '@/app/components/island-boundary';
import { ApplyPanel } from './apply-panel';
import { JobDetailSkeleton } from './job-detail-skeleton';
import { MatchBadge } from './match-badge';
import { SimilarJobs } from './similar-jobs';
import { ViewTracker } from './view-tracker';

type Params = Promise<{ slug: string }>;

const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
};

// Deterministic formatting for the deadline (no locale drift between servers).
const deadlineFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// Glassy chip that reads well over the ambient band wash.
const metaChip = META_CHIP;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return { title: 'Job not found' };

  const company = job.company.companyProfile?.companyName ?? 'Company';
  const title = `${job.title} at ${company}`;
  const description = job.description.slice(0, 200);
  // `images` points at the opengraph-image/route.ts Route Handler in this
  // segment rather than relying on the opengraph-image.tsx special-file
  // convention's auto-detection: that convention isn't routed correctly
  // when nested inside a route group under Next 16.2.7 + Turbopack (see the
  // comment in opengraph-image/route.tsx), so this route handler generates
  // the same image and the URL is wired in explicitly here instead.
  const image = `/jobs/${job.slug}/opengraph-image`;
  return {
    title,
    description: job.description.slice(0, 160),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/jobs/${job.slug}`,
      siteName: 'Joblify',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function JobDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  // The JD body depends on a per-slug DB read. Keep it behind a runtime
  // (Suspense) boundary so the build prerenders only the static shell — a
  // top-level await here would prerender a not-found shell at build (no slug /
  // empty DB) and the CDN would then serve that stale 404 for every slug.
  return (
    <Suspense fallback={<JobDetailSkeleton />}>
      <JobDetailBody slug={slug} />
    </Suspense>
  );
}

async function JobDetailBody({ slug }: { slug: string }) {
  await connection();
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return (
    <main>
      <ViewTracker jobId={job.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jobPostingJsonLd({ job, company: job.company, siteUrl }),
        }}
      />

      <AmbientBand>
        <header className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <p className="eyebrow m-0 mb-3">
            {job.company.companyProfile?.companyName ?? 'Open role'}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {job.company.companyProfile?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- remote company logo, fixed size
              <img
                src={job.company.companyProfile.logoUrl}
                alt=""
                width={48}
                height={48}
                className="rounded-control object-cover"
              />
            )}
            <h1 className="display m-0 text-3xl text-fg sm:text-4xl">{job.title}</h1>
            {/* Decorative enhancement over pgvector — must never be able to
                take down the JD page, which is the SEO surface. */}
            <IslandBoundary fallback={null}>
              <Suspense fallback={null}>
                <MatchBadge jobId={job.id} />
              </Suspense>
            </IslandBoundary>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {job.location && (
              <Badge tone="neutral" className={metaChip}>
                {job.location}
              </Badge>
            )}
            <Badge tone="neutral" className={metaChip}>
              {JOB_TYPE_LABELS[job.jobType]}
            </Badge>
            {/* Skip when job.location already reads "Remote"/"Hybrid" (common
                when the poster fills it in that way) — avoids a duplicate pill. */}
            {(job.workMode === 'REMOTE' || job.workMode === 'HYBRID') &&
              job.location?.trim().toLowerCase() !== job.workMode.toLowerCase() && (
                <Badge tone="neutral" className={metaChip}>
                  {job.workMode === 'REMOTE' ? 'Remote' : 'Hybrid'}
                </Badge>
              )}
            {job.salaryMin && job.salaryMax && (
              <Badge tone="dark">
                {job.salaryCurrency} {job.salaryMin.toLocaleString('en-US')} –{' '}
                {job.salaryMax.toLocaleString('en-US')} per year
              </Badge>
            )}
          </div>
          {job.applicationDeadline && (
            <p className="mt-4 mb-0 text-sm font-semibold text-fg">
              Apply by {deadlineFormat.format(job.applicationDeadline)}
            </p>
          )}
          {job.skills.length > 0 && (
            <section className="mt-4 flex flex-wrap gap-2" aria-label="Skills">
              {job.skills.map((js) => (
                <Badge key={js.skillId} className={metaChip}>
                  {js.skill.label}
                </Badge>
              ))}
            </section>
          )}
        </header>
      </AmbientBand>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <article className="leading-relaxed whitespace-pre-wrap text-fg">{job.description}</article>

        {job.requirements && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-fg">Requirements</h2>
            <p className="leading-relaxed whitespace-pre-wrap text-fg">{job.requirements}</p>
          </section>
        )}

        {job.benefits.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-fg">Benefits</h2>
            <ul className="list-disc pl-5 text-fg">
              {job.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12">
          <Card tone="glass" className="p-6 sm:p-8">
            <Suspense fallback={<p className="m-0 text-fg-muted">Loading apply options…</p>}>
              <ApplyPanel jobId={job.id} slug={job.slug} />
            </Suspense>
          </Card>
        </section>

        <IslandBoundary fallback={null}>
          <Suspense fallback={null}>
            <SimilarJobs
              jobId={job.id}
              industry={job.industry}
              skillIds={job.skills.map((js) => js.skillId)}
            />
          </Suspense>
        </IslandBoundary>
      </div>
    </main>
  );
}

// PPR: cached JD shell, dynamic apply panel.
// Exported so opengraph-image.tsx can reuse the same cached query rather
// than duplicating it — one source of truth for what a JD's OG card shows.
export async function getJobBySlug(slug: string) {
  'use cache';
  // cache helpers resolve from next/cache (Next 16)
  const { cacheTag, cacheLife } = await import('next/cache');
  cacheLife('hours');

  const job = await db.jobPost.findUnique({
    where: { slug },
    include: {
      company: { include: { companyProfile: true } },
      skills: { include: { skill: true } },
    },
  });

  if (!job || job.deletedAt || job.status !== 'PUBLISHED') return null;

  cacheTag(tags.job(job.id), tags.company(job.companyId));
  return job;
}
