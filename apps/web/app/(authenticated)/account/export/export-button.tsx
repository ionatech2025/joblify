'use client';

import { useState, useTransition } from 'react';

export function ExportButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function start() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/account/export', { method: 'POST' });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `Failed: ${res.status}`);
        }
        const body = (await res.json()) as { url: string };
        setMessage(`Export ready. Download: ${body.url}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
      }
    });
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <button
        onClick={start}
        disabled={isPending}
        style={{ padding: '0.75rem 1.25rem', background: '#111', color: 'white', borderRadius: 8, border: 0, fontWeight: 600, cursor: isPending ? 'wait' : 'pointer' }}
      >
        {isPending ? 'Building export…' : 'Request data export'}
      </button>
      {message && <p style={{ color: '#114411', marginTop: '1rem' }}>{message}</p>}
      {error && <p style={{ color: '#a00', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
}
