'use client';

import { useState, useTransition } from 'react';
import { saveSearch } from '@/app/actions/saved-searches';
import { Button } from '@/app/components/ui/button';

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
      <Button type="button" variant="secondary" size="sm" onClick={save} disabled={pending}>
        {pending ? 'Saving…' : '☆ Save search'}
      </Button>
      {error && <span className="text-sm text-red-700">{error}</span>}
    </span>
  );
}
