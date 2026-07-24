'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toggleSavedJob } from '@/app/actions/saved-jobs';
import { Button } from '@/app/components/ui/button';

type SavedRow = { id: string; slug: string; title: string; company: string; location: string | null };

export function SavedList({ initial }: { initial: SavedRow[] }) {
  const [jobs, setJobs] = useState(initial);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove(jobId: string) {
    const prev = jobs;
    setError(null);
    setJobs((j) => j.filter((x) => x.id !== jobId)); // optimistic
    startTransition(async () => {
      try {
        await toggleSavedJob(jobId);
      } catch {
        setJobs(prev);
        setError('Could not remove that job. Try again.');
      }
    });
  }

  if (jobs.length === 0) {
    return (
      <p className="mt-6 text-neutral-500">No saved jobs yet. Tap “Save job” on any listing to keep it here.</p>
    );
  }

  return (
    <>
      {error && <p className="text-red-700">{error}</p>}
      <ul className="mt-6 flex list-none flex-col gap-3 p-0">
        {jobs.map((j) => (
          <li
            key={j.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-soft"
          >
            <Link href={`/jobs/${j.slug}`} className="min-w-0 text-neutral-900 no-underline">
              <strong>{j.title}</strong>
              <span className="text-neutral-600">
                {' — '}
                {j.company}
                {j.location ? ` · ${j.location}` : ''}
              </span>
            </Link>
            <Button
              variant="danger"
              size="sm"
              type="button"
              onClick={() => remove(j.id)}
              aria-label={`Remove ${j.title} from saved`}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}
