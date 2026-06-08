import { Suspense } from 'react';
import { JobsSearch } from './jobs-search';

export const metadata = {
  title: 'Search jobs',
  description: 'Browse jobs by skill, location, work mode, and salary.',
};

export default function JobsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Search jobs</h1>
      {/* JobsSearch reads useSearchParams() — must sit inside a Suspense boundary. */}
      <Suspense fallback={<p className="text-neutral-500">Loading…</p>}>
        <JobsSearch />
      </Suspense>
    </main>
  );
}
