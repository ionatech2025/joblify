'use client';

import { useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import { toggleSavedJob } from '@/app/actions/saved-jobs';
import { toast } from '@/lib/stores/ui';
import { cn } from '@/lib/cn';

export function SaveButton({ jobId, initialSaved }: { jobId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !saved;
    setSaved(next); // optimistic
    startTransition(async () => {
      try {
        const r = await toggleSavedJob(jobId);
        setSaved(r.saved);
        toast.success(r.saved ? 'Job saved' : 'Removed from saved jobs');
      } catch {
        // The optimistic star used to just flip back with no explanation.
        setSaved(!next);
        toast.error(
          next ? "Couldn't save this job" : "Couldn't remove this job",
          'Check your connection and try again.',
        );
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      className={cn(
        'focus-visible:ring-brand focus-visible:ring-offset-canvas inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait',
        saved
          ? 'border-border-strong bg-brand-subtle text-brand'
          : 'border-border-strong bg-surface text-fg-muted hover:bg-surface-sunken',
      )}
    >
      <Star aria-hidden className="size-4" fill={saved ? 'currentColor' : 'none'} />
      {saved ? 'Saved' : 'Save job'}
    </button>
  );
}
