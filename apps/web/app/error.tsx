'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main style={{ padding: '4rem 2rem', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem' }}>Something went wrong</h1>
      <p style={{ color: '#666' }}>An unexpected error occurred. You can try again, or head back home.</p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
        <button
          onClick={reset}
          style={{ padding: '0.6rem 1.1rem', background: '#111', color: '#fff', border: 0, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{ padding: '0.6rem 1.1rem', border: '1px solid #ccc', borderRadius: 8, color: '#111', textDecoration: 'none' }}
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
