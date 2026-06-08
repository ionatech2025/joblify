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
      style={{
        padding: '0.5rem 1rem',
        background: saved ? '#eef2ff' : '#fff',
        color: saved ? '#3344aa' : '#333',
        border: `1px solid ${saved ? '#c3cdf5' : '#ccc'}`,
        borderRadius: 8,
        fontWeight: 600,
        cursor: pending ? 'wait' : 'pointer',
      }}
    >
      {saved ? '★ Saved' : '☆ Save job'}
    </button>
  );
}
