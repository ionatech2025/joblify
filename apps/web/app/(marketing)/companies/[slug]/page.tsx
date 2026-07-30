import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { db } from '@/lib/db';
import { tags } from '@/lib/cache';
import { Briefcase } from 'lucide-react';
import { AmbientBand } from '@/app/components/ui/ambient';
import { EmptyState } from '@/app/components/ui/empty-state';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';
import { CompanyDetailSkeleton } from './company-detail-skeleton';
import { SubscribeButton } from './subscribe-button';

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
  // Defer the per-slug DB read to runtime (see jobs/[slug] for the rationale):
  // a top-level await would prerender a not-found shell at build and the CDN
  // would serve that stale 404 for every company.
  return (
    <Suspense fallback={<CompanyDetailSkeleton />}>
      <CompanyDetailBody slug={slug} />
    </Suspense>
  );
}

async function CompanyDetailBody({ slug }: { slug: string }) {
  await connection();
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const openJobs = await db.jobPost.findMany({
    where: { companyId: company.userId, status: 'PUBLISHED', deletedAt: null },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  return (
    <main>
      <AmbientBand>
        <header className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 px-4 py-10 sm:px-6">
          {company.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- remote company logo, fixed size
            <img
              src={company.logoUrl}
              alt=""
              width={72}
              height={72}
              className="size-[72px] rounded-card object-cover"
            />
          )}
          <div>
            <p className="eyebrow m-0 mb-2">Company profile</p>
            <h1 className="display m-0 text-3xl text-fg sm:text-4xl">{company.companyName}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="neutral" className="bg-surface/70 backdrop-blur-sm">
                {company.industry.replace('_', ' ')}
              </Badge>
              <Badge tone="neutral" className="bg-surface/70 backdrop-blur-sm">
                {company.companySize.replace('_', ' ').toLowerCase()}
              </Badge>
            </div>
          </div>
          <div className="ml-auto">
            <SubscribeButton companyUserId={company.userId} />
          </div>
        </header>
      </AmbientBand>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <article className="mb-8 leading-relaxed whitespace-pre-wrap text-fg">
          {company.description}
        </article>

        {company.website && (
          <p>
            <a
              href={company.website}
              rel="noopener noreferrer"
              target="_blank"
              className="text-brand hover:underline"
            >
              {company.website}
            </a>
          </p>
        )}

        <section className="mt-12">
          <p className="eyebrow m-0">Now hiring</p>
          <h2 className="display m-0 mt-2 mb-4 text-2xl text-fg">Open positions</h2>
          {openJobs.length === 0 ? (
            <EmptyState
              icon={<Briefcase />}
              title="No open positions right now"
              description="Subscribe to this company and you'll be notified the moment they publish a role."
            />
          ) : (
            <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
              {openJobs.map((job) => (
                <li key={job.id}>
                  <Link href={`/jobs/${job.slug}`} className="block h-full no-underline">
                    <Card className="h-full transition-shadow hover:shadow-md">
                      <h3 className="m-0 text-base font-semibold text-fg">{job.title}</h3>
                      {job.location && (
                        <p className="mt-1 mb-0 text-sm text-fg-muted">{job.location}</p>
                      )}
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
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
