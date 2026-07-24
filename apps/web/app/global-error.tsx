'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// Catches errors in the root layout itself. Must render its own <html>/<body>,
// and compiled CSS may not be available here — so the design language (eyebrow,
// display headline, ink pill) is reproduced with inline styles only.
export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
          padding: '6rem 2rem',
          textAlign: 'center',
          background: '#fff',
          color: '#171717',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#4f46e5',
          }}
        >
          Error
        </p>
        <h1 style={{ margin: '0.75rem 0 0', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
          Something went wrong
        </h1>
        <p style={{ color: '#666', margin: '0.75rem 0 0' }}>The app hit a critical error. Try reloading.</p>
        <button
          onClick={reset}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            background: '#0a0a0a',
            color: '#fff',
            border: 0,
            borderRadius: 9999,
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
