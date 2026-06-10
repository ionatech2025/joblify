import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { db } from '@/lib/db';
import { tags } from '@/lib/cache';
import { jobPostingJsonLd } from '@/lib/seo/job-jsonld';
import { Badge } from '@/app/components/ui/badge';
import { AmbientBand } from '@/app/components/ui/ambient';
import { ApplyPanel } from './apply-panel';
import { MatchBadge } from './match-badge';
import { SimilarJobs } from './similar-jobs';
import { ViewTracker } from './view-tracker';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return { title: 'Job not found' };

  const company = job.company.companyProfile?.companyName ?? 'Company';
  return {
    title: `${job.title} at ${company}`,
    description: job.description.slice(0, 160),
    openGraph: {
      title: `${job.title} at ${company}`,
      description: job.description.slice(0, 200),
      type: 'website',
      url: `/jobs/${job.slug}`,
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

function JobDetailSkeleton() {
  return (
    <main>
      <AmbientBand>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="h-8 w-2/3 animate-pulse rounded bg-neutral-200" />
          <div className="mt-4 h-4 w-1/3 animate-pulse rounded bg-neutral-100" />
        </div>
      </AmbientBand>
    </main>
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
        dangerouslySetInnerHTML={{ __html: jobPostingJsonLd({ job, company: job.company, siteUrl }) }}
      />

      <AmbientBand>
        <header className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            {job.company.companyProfile?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- remote company logo, fixed size
              <img
                src={job.company.companyProfile.logoUrl}
                alt=""
                width={48}
                height={48}
                className="rounded-lg object-cover"
              />
            )}
            <h1 className="m-0 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{job.title}</h1>
            <Suspense fallback={null}>
              <MatchBadge jobId={job.id} />
            </Suspense>
          </div>
          <p className="mt-2 mb-0 text-neutral-600">
            {job.company.companyProfile?.companyName ?? 'Company'}
            {job.location ? ` · ${job.location}` : ''}
            {job.workMode === 'REMOTE' ? ' · Remote' : job.workMode === 'HYBRID' ? ' · Hybrid' : ''}
          </p>
          {job.salaryMin && job.salaryMax && (
            <p className="mt-1 mb-0 font-medium text-neutral-700">
              {job.salaryCurrency} {job.salaryMin.toLocaleString()} – {job.salaryMax.toLocaleString()} per year
            </p>
          )}
          {job.skills.length > 0 && (
            <section className="mt-4 flex flex-wrap gap-2" aria-label="Skills">
              {job.skills.map((js) => (
                <Badge key={js.skillId} className="bg-white/70 backdrop-blur-sm">
                  {js.skill.label}
                </Badge>
              ))}
            </section>
          )}
        </header>
      </AmbientBand>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <article className="leading-relaxed whitespace-pre-wrap text-neutral-800">{job.description}</article>

      {job.requirements && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-900">Requirements</h2>
          <p className="leading-relaxed whitespace-pre-wrap text-neutral-800">{job.requirements}</p>
        </section>
      )}

      {job.benefits.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-900">Benefits</h2>
          <ul className="list-disc pl-5 text-neutral-800">
            {job.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 rounded-xl border border-neutral-200 bg-white/70 p-6 backdrop-blur-sm">
        <Suspense fallback={<p>Loading apply options…</p>}>
          <ApplyPanel jobId={job.id} slug={job.slug} />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <SimilarJobs jobId={job.id} industry={job.industry} skillIds={job.skills.map((js) => js.skillId)} />
      </Suspense>
      </div>
    </main>
  );
}

// PPR: cached JD shell, dynamic apply panel.
async function getJobBySlug(slug: string) {
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
