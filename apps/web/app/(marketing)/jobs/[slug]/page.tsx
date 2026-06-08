import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { db } from '@/lib/db';
import { tags } from '@/lib/cache';
import { jobPostingJsonLd } from '@/lib/seo/job-jsonld';
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
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return (
    <main style={{ padding: '3rem 2rem', maxWidth: 960, margin: '0 auto' }}>
      <ViewTracker jobId={job.id} />
      <script
        type="application/ld+json"
         
        dangerouslySetInnerHTML={{ __html: jobPostingJsonLd({ job, company: job.company, siteUrl }) }}
      />

      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {job.company.companyProfile?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- remote company logo, fixed size
            <img
              src={job.company.companyProfile.logoUrl}
              alt=""
              width={48}
              height={48}
              style={{ borderRadius: 8, objectFit: 'cover' }}
            />
          )}
          <h1 style={{ margin: 0 }}>{job.title}</h1>
          <Suspense fallback={null}>
            <MatchBadge jobId={job.id} />
          </Suspense>
        </div>
        <p style={{ margin: '0.5rem 0 0', color: '#555' }}>
          {job.company.companyProfile?.companyName ?? 'Company'}
          {job.location ? ` · ${job.location}` : ''}
          {job.workMode === 'REMOTE' ? ' · Remote' : job.workMode === 'HYBRID' ? ' · Hybrid' : ''}
        </p>
        {job.salaryMin && job.salaryMax && (
          <p style={{ margin: '0.25rem 0', color: '#444' }}>
            {job.salaryCurrency} {job.salaryMin.toLocaleString()} – {job.salaryMax.toLocaleString()} per year
          </p>
        )}
      </header>

      {job.skills.length > 0 && (
        <section
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}
          aria-label="Skills"
        >
          {job.skills.map((js) => (
            <span
              key={js.skillId}
              style={{
                fontSize: '0.82rem',
                background: '#eef2ff',
                color: '#3344aa',
                padding: '0.2rem 0.6rem',
                borderRadius: 999,
              }}
            >
              {js.skill.label}
            </span>
          ))}
        </section>
      )}

      <article style={{ lineHeight: 1.6, color: '#222', whiteSpace: 'pre-wrap' }}>
        {job.description}
      </article>

      {job.requirements && (
        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Requirements</h2>
          <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{job.requirements}</p>
        </section>
      )}

      {job.benefits.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Benefits</h2>
          <ul>
            {job.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ marginTop: '3rem', padding: '1.5rem', background: '#fafafa', borderRadius: 8 }}>
        <Suspense fallback={<p>Loading apply options…</p>}>
          <ApplyPanel jobId={job.id} slug={job.slug} />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <SimilarJobs jobId={job.id} industry={job.industry} skillIds={job.skills.map((js) => js.skillId)} />
      </Suspense>
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
