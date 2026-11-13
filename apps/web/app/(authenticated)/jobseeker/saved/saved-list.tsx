'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { toggleSavedJob } from '@/app/actions/saved-jobs';
import { Badge } from '@/app/components/ui/badge';
import { Button, buttonClasses } from '@/app/components/ui/button';
import { EmptyState } from '@/app/components/ui/empty-state';
import { ListView, type ListColumn } from '@/app/components/console/list-view';
import { toast } from '@/lib/stores/ui';
import { unwrap } from '@/lib/action-result';
import { moveFocusFromRowAction } from '../move-focus';

export type SavedRow = {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string | null;
  /**
   * `closed`: past its deadline, page still public. `unlisted`: no longer
   * published, so there is no page to link to.
   */
  availability: 'open' | 'closed' | 'unlisted';
};

export function SavedList({ initial, headingId }: { initial: SavedRow[]; headingId: string }) {
  const [jobs, setJobs] = useState(initial);
  const [, startTransition] = useTransition();

  function remove(jobId: string, title: string, button: HTMLElement) {
    moveFocusFromRowAction(button, document.getElementById(headingId));
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

  const columns: ListColumn<SavedRow>[] = [
    {
      key: 'role',
      header: 'Role',
      cell: (j) => (
        <div className="min-w-0">
          {j.availability === 'unlisted' ? (
            <span className="text-fg font-medium">{j.title}</span>
          ) : (
            <Link
              href={`/jobs/${j.slug}`}
              className="text-fg font-medium no-underline hover:underline"
            >
              {j.title}
            </Link>
          )}
          {j.availability !== 'open' && (
            <Badge tone="neutral" className="ml-2">
              No longer accepting applications
            </Badge>
          )}
          <span className="text-fg-muted block text-[12px] sm:hidden">
            {j.company}
            {j.location ? ` · ${j.location}` : ''}
          </span>
        </div>
      ),
      aggregate: () => `${jobs.length} saved`,
    },
    {
      key: 'company',
      header: 'Company',
      hideBelow: 'sm',
      cell: (j) => <span className="text-fg-muted">{j.company}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      hideBelow: 'md',
      cell: (j) => <span className="text-fg-muted">{j.location ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (j) => (
        <Button
          variant="danger"
          size="sm"
          type="button"
          data-row-action="remove-saved-job"
          onClick={(e) => remove(j.id, j.title, e.currentTarget)}
          aria-label={`Remove ${j.title} from saved`}
        >
          Remove
        </Button>
      ),
    },
  ];

  return <ListView caption="Saved jobs" rows={jobs} rowKey={(j) => j.id} columns={columns} />;
}
