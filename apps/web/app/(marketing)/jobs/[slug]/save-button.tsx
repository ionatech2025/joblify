'use client';

import { useState, useTransition } from 'react';
import { toggleSavedJob } from '@/app/actions/saved-jobs';

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
      } catch {
        setSaved(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      className={`rounded-lg border px-4 py-2 font-semibold transition-colors disabled:cursor-wait ${
        saved
          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
          : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
      }`}
    >
      {saved ? '★ Saved' : '☆ Save job'}
    </button>
  );
}
