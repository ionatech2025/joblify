import { Suspense } from 'react';
import { connection } from 'next/server';
import { JobsSearch } from './jobs-search';
import { JobsSearchSkeleton } from './jobs-search-skeleton';
import { PageHeader } from '@/app/components/ui/ambient';
import { canonicalSearchString, type RawSearchParams } from '@/lib/search/job-search-query';
import { loadFirstPage } from '@/lib/search/jobs-first-page';

export const metadata = {
  title: 'Search jobs',
  description: 'Browse jobs by skill, location, work mode, and salary.',
};

type SearchParams = Promise<RawSearchParams>;

export default function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  // min-h-svh keeps the footer below the fold until the results arrive, so their
  // late arrival cannot shift anything that is on screen.
  return (
    <main className="min-h-svh">
      <PageHeader
        eyebrow="Open roles"
        title="Search jobs"
        subtitle="Browse by skill, location, work mode, and salary."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* The shell above is prerendered; the search below depends on the
            request's query string, so it streams in behind this boundary —
            with the first page of results already in it. */}
        <Suspense fallback={<JobsSearchSkeleton />}>
          <JobsSearchWithResults searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function JobsSearchWithResults({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const qs = canonicalSearchString(await searchParams);
  // `null` (slow, failed, rate-limited, invalid) is not an error state: the
  // client fetches the page itself, which is what happened for every visit
  // before the server ran the search.
  const initialData = await loadFirstPage(qs);

  return <JobsSearch initialQs={qs} initialData={initialData} />;
}
