'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteSavedSearch } from '@/app/actions/saved-searches';
import { Button } from '@/app/components/ui/button';

type Row = { id: string; label: string; query: string };

export function SavedSearchList({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [, startTransition] = useTransition();

  function remove(id: string) {
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== id)); // optimistic
    startTransition(async () => {
      try {
        await deleteSavedSearch(id);
      } catch {
        setRows(prev);
      }
    });
  }

  if (rows.length === 0) return null;

  return (
    <ul className="mt-3 flex list-none flex-col gap-2 p-0">
      {rows.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-soft"
        >
          <Link
            href={`/jobs?${s.query}`}
            className="min-w-0 truncate font-medium text-neutral-900 no-underline hover:underline"
          >
            {s.label}
          </Link>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="shrink-0"
            onClick={() => remove(s.id)}
            aria-label={`Delete saved search ${s.label}`}
          >
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
}
