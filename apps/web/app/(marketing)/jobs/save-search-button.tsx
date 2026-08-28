'use client';

import { useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import { saveSearch } from '@/app/actions/saved-searches';
import { Button } from '@/app/components/ui/button';
import { toast } from '@/lib/stores/ui';
import { unwrap } from '@/lib/action-result';

export function SaveSearchButton({ query }: { query: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function save() {
    startTransition(async () => {
      try {
        unwrap(await saveSearch({ query }));
        setDone(true);
        toast.success('Search saved', 'Re-run it any time from Saved jobs & searches.');
      } catch (e) {
        // The inline error line is gone: a toast survives the layout shift when
        // results re-render underneath, and carries the recovery hint.
        toast.error(
          "Couldn't save this search",
          e instanceof Error ? e.message : 'Try again in a moment.',
        );
      }
    });
  }

  if (done)
    return (
      <span className="text-success inline-flex items-center gap-1.5 text-sm font-medium">
        <Star aria-hidden className="size-4" fill="currentColor" />
        Search saved
      </span>
    );

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={save}
      loading={pending}
      icon={<Star aria-hidden className="size-4" />}
    >
      {pending ? 'Saving…' : 'Save search'}
    </Button>
  );
}
