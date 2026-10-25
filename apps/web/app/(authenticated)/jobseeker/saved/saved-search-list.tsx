'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { deleteSavedSearch } from '@/app/actions/saved-searches';
import { Button, buttonClasses } from '@/app/components/ui/button';
import { EmptyState } from '@/app/components/ui/empty-state';
import { ListView, type ListColumn } from '@/app/components/console/list-view';
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

  const columns: ListColumn<Row>[] = [
    {
      key: 'label',
      header: 'Saved search',
      cell: (s) => (
        <Link
          href={`/jobs?${s.query}`}
          className="text-fg font-medium no-underline hover:underline"
        >
          {s.label}
        </Link>
      ),
      aggregate: () => `${rows.length} saved`,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (s) => (
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => remove(s.id, s.label)}
          aria-label={`Delete saved search ${s.label}`}
        >
          Delete
        </Button>
      ),
    },
  ];

  return <ListView caption="Saved searches" rows={rows} rowKey={(s) => s.id} columns={columns} />;
}
