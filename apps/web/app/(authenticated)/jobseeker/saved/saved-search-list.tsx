'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { deleteSavedSearch } from '@/app/actions/saved-searches';
import { Button, buttonClasses } from '@/app/components/ui/button';
import { EmptyState } from '@/app/components/ui/empty-state';
import { toast } from '@/lib/stores/ui';

type Row = { id: string; label: string; query: string };

export function SavedSearchList({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [, startTransition] = useTransition();

  function remove(id: string, label: string) {
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== id)); // optimistic
    startTransition(async () => {
      try {
        await deleteSavedSearch(id);
        toast.success('Saved search deleted', label);
      } catch {
        // Used to roll back silently — the row simply reappeared with no reason.
        setRows(prev);
        toast.error("Couldn't delete that search", 'Try again in a moment.');
      }
    });
  }

  // Previously returned null, which left the "Saved searches" heading above it
  // dangling with nothing underneath and no hint at how to create one.
  if (rows.length === 0) {
    return (
      <EmptyState
        size="sm"
        className="mt-3"
        icon={<SearchX />}
        title="No saved searches"
        description="Run a search on the jobs page and choose “Save this search” to re-run it here in one click."
        action={
          <Link href="/jobs" className={`${buttonClasses('secondary', 'sm')} no-underline`}>
            Go to search
          </Link>
        }
      />
    );
  }

  return (
    <ul className="mt-3 flex list-none flex-col gap-2 p-0">
      {rows.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-3 shadow-soft"
        >
          <Link
            href={`/jobs?${s.query}`}
            className="min-w-0 truncate font-medium text-fg no-underline hover:underline"
          >
            {s.label}
          </Link>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="shrink-0"
            onClick={() => remove(s.id, s.label)}
            aria-label={`Delete saved search ${s.label}`}
          >
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
}
