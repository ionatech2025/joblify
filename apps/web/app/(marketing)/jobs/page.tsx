import { Suspense } from 'react';
import { JobsSearch } from './jobs-search';
import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = {
  title: 'Search jobs',
  description: 'Browse jobs by skill, location, work mode, and salary.',
};

export default function JobsPage() {
  return (
    <main>
      <PageHeader title="Search jobs" subtitle="Browse by skill, location, work mode, and salary." />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* JobsSearch reads useSearchParams() — must sit inside a Suspense boundary. */}
        <Suspense fallback={<p className="text-neutral-500">Loading…</p>}>
          <JobsSearch />
        </Suspense>
      </div>
    </main>
  );
}
