'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { toggleSavedJob } from '@/app/actions/saved-jobs';
import { Button, buttonClasses } from '@/app/components/ui/button';
import { EmptyState } from '@/app/components/ui/empty-state';
import { toast } from '@/lib/stores/ui';
import { unwrap } from '@/lib/action-result';

type SavedRow = {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string | null;
};

export function SavedList({ initial }: { initial: SavedRow[] }) {
  const [jobs, setJobs] = useState(initial);
  const [, startTransition] = useTransition();

  function remove(jobId: string, title: string) {
    const prev = jobs;
    setJobs((j) => j.filter((x) => x.id !== jobId)); // optimistic
    startTransition(async () => {
      try {
        unwrap(await toggleSavedJob(jobId));
        toast.success('Removed from saved jobs', title);
      } catch {
        // The row reappears; the toast explains why, which the previous inline
        // error line above the list did not reliably do once it scrolled away.
        setJobs(prev);
        toast.error("Couldn't remove that job", 'Try again in a moment.');
      }
    });
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        className="mt-6"
        icon={<Bookmark />}
        title="No saved jobs yet"
        description="Tap “Save job” on any listing and it will wait for you here."
        action={
          <Link href="/jobs" className={`${buttonClasses()} no-underline`}>
            Browse jobs
          </Link>
        }
      />
    );
  }

  return (
    <>
      <ul className="mt-6 flex list-none flex-col gap-3 p-0">
        {jobs.map((j) => (
          <li
            key={j.id}
            className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-4 shadow-soft"
          >
            <Link href={`/jobs/${j.slug}`} className="min-w-0 text-fg no-underline">
              <strong>{j.title}</strong>
              <span className="text-fg-muted">
                {' — '}
                {j.company}
                {j.location ? ` · ${j.location}` : ''}
              </span>
            </Link>
            <Button
              variant="danger"
              size="sm"
              type="button"
              onClick={() => remove(j.id, j.title)}
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
