import { Suspense } from 'react';
import { JobsSearch } from './jobs-search';

export const metadata = {
  title: 'Search jobs',
  description: 'Browse jobs by skill, location, work mode, and salary.',
};

export default function JobsPage() {
  return (
    <main>
      <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Search jobs</h1>
          <p className="mt-1 text-neutral-600">Browse by skill, location, work mode, and salary.</p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* JobsSearch reads useSearchParams() — must sit inside a Suspense boundary. */}
        <Suspense fallback={<p className="text-neutral-500">Loading…</p>}>
          <JobsSearch />
        </Suspense>
      </div>
    </main>
  );
}
