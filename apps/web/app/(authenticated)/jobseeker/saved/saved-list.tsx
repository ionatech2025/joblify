'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toggleSavedJob } from '@/app/actions/saved-jobs';

type SavedRow = { id: string; slug: string; title: string; company: string; location: string | null };

export function SavedList({ initial }: { initial: SavedRow[] }) {
  const [jobs, setJobs] = useState(initial);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove(jobId: string) {
    const prev = jobs;
    setError(null);
    setJobs((j) => j.filter((x) => x.id !== jobId)); // optimistic
    startTransition(async () => {
      try {
        await toggleSavedJob(jobId);
      } catch {
        setJobs(prev);
        setError('Could not remove that job. Try again.');
      }
    });
  }

  if (jobs.length === 0) {
    return (
      <p style={{ color: '#888', marginTop: '1.5rem' }}>
        No saved jobs yet. Tap “Save job” on any listing to keep it here.
      </p>
    );
  }

  return (
    <>
      {error && <p style={{ color: '#a00' }}>{error}</p>}
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {jobs.map((j) => (
          <li
            key={j.id}
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              padding: '0.9rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <Link href={`/jobs/${j.slug}`} style={{ color: 'inherit', textDecoration: 'none', minWidth: 0 }}>
              <strong>{j.title}</strong>
              <span style={{ color: '#666' }}>
                {' — '}
                {j.company}
                {j.location ? ` · ${j.location}` : ''}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => remove(j.id)}
              style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: 6, padding: '0.4rem 0.7rem', cursor: 'pointer', color: '#a00', flexShrink: 0 }}
              aria-label={`Remove ${j.title} from saved`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
