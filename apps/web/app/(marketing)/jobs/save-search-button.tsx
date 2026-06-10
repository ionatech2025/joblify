'use client';

import { useState, useTransition } from 'react';
import { saveSearch } from '@/app/actions/saved-searches';

export function SaveSearchButton({ query }: { query: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await saveSearch({ query });
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save the search.');
      }
    });
  }

  if (done) return <span className="text-sm font-medium text-green-700">★ Search saved</span>;

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
      >
        {pending ? 'Saving…' : '☆ Save search'}
      </button>
      {error && <span className="text-sm text-red-700">{error}</span>}
    </span>
  );
}
