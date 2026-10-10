'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/app/components/ui/button';
import { toast } from '@/lib/stores/ui';

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
        // The response IS the file — nothing is stored server-side and there is
        // no link to share or leak. Hand it to the browser as a download.
        const blob = await res.blob();
        const name =
          /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ??
          'joblify-data-export.json';
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
        setMessage(`Your export was downloaded as ${name}.`);
        toast.success('Export ready', 'Your file has been downloaded.');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Export failed';
        setError(message);
        toast.error('Export failed', message);
      }
    });
  }

  return (
    <div className="mt-6">
      <Button onClick={start} disabled={isPending}>
        {isPending ? 'Building export…' : 'Request data export'}
      </Button>
      {message && <p className="mt-4 text-success">{message}</p>}
      {error && <p className="mt-4 text-danger">{error}</p>}
    </div>
  );
}
