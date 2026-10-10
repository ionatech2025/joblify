import { Suspense } from 'react';
import { JobsSearch } from './jobs-search';
import { JobsSearchSkeleton } from './jobs-search-skeleton';
import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = {
  title: 'Search jobs',
  description: 'Browse jobs by skill, location, work mode, and salary.',
};

export default function JobsPage() {
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
        {/* JobsSearch reads useSearchParams() — must sit inside a Suspense boundary. */}
        <Suspense fallback={<JobsSearchSkeleton />}>
          <JobsSearch />
        </Suspense>
      </div>
    </main>
  );
}
