'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/app/components/ui/button';

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
    <div className="mt-6">
      <Button onClick={start} disabled={isPending}>
        {isPending ? 'Building export…' : 'Request data export'}
      </Button>
      {message && <p className="mt-4 break-all text-success">{message}</p>}
      {error && <p className="mt-4 text-danger">{error}</p>}
    </div>
  );
}
