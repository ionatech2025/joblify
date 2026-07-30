import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { tags } from '@/lib/cache';
import { Building2 } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { PageHeader } from '@/app/components/ui/ambient';
import { EmptyState } from '@/app/components/ui/empty-state';
import { SkeletonList } from '@/app/components/ui/skeleton';
import { IslandBoundary } from '@/app/components/island-boundary';
import { buttonClasses } from '@/app/components/ui/button';

export const metadata = {
  title: 'Companies hiring on Joblify',
  description: 'Browse verified companies hiring across industries.',
};

export default function CompaniesPage() {
  return (
    <main>
      <PageHeader
        eyebrow="Directory"
        title="Companies hiring"
        subtitle="Browse verified companies hiring across industries."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <IslandBoundary
          fallback={
            <EmptyState
              icon={<Building2 />}
              title="Couldn’t load companies"
              description="Try again in a moment, or search open roles directly."
              action={
                <Link href="/jobs" className={`${buttonClasses()} no-underline`}>
                  Browse jobs
                </Link>
              }
            />
          }
        >
          <Suspense fallback={<SkeletonList count={6} />}>
            <CompaniesList />
          </Suspense>
        </IslandBoundary>
      </div>
    </main>
  );
}

async function CompaniesList() {
  // Dynamic boundary so the build needs no DB; the query is cached at runtime.
  await connection();
  const companies = await getCompaniesList();

  if (companies.length === 0) {
    return (
      <EmptyState
        icon={<Building2 />}
        title="No companies listed yet"
        description="Verified companies appear here as they join. Check back soon — or list yours."
        action={
          <Link href="/employer-setup" className={`${buttonClasses()} no-underline`}>
            List your company
          </Link>
        }
      />
    );
  }

  return (
    <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {companies.map((c) => (
        <li key={c.id}>
          <Link href={`/companies/${c.slug}`} className="block h-full no-underline">
            <Card className="flex h-full items-start gap-4 transition-shadow hover:shadow-md">
              {c.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote company logo, fixed small size
                <img
                  src={c.logoUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="size-12 shrink-0 rounded-control object-cover"
                />
              ) : (
                <div
                  className="size-12 shrink-0 rounded-control bg-surface-sunken"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0">
                <h3 className="m-0 text-base font-semibold text-fg">{c.companyName}</h3>
                <div className="mt-2">
                  <Badge tone="neutral">{c.industry.replace('_', ' ')}</Badge>
                </div>
              </div>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function getCompaniesList() {
  'use cache';
  const { cacheTag, cacheLife } = await import('next/cache');
  cacheTag(tags.companies());
  cacheLife('hours');

  return db.companyProfile.findMany({
    where: { verificationStatus: 'VERIFIED' },
    orderBy: { companyName: 'asc' },
    take: 60,
  });
}
