'use client';

import { useState, useTransition } from 'react';
import { deleteMyAccount } from '@/app/actions/account';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/form';
import { toast } from '@/lib/stores/ui';
import { unwrap } from '@/lib/action-result';

export function DeleteForm({ expectedConfirmation }: { expectedConfirmation: string }) {
  const [confirmation, setConfirmation] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        // On success this redirects server-side (see deleteMyAccount) and
        // never returns to this component, so only the failure path needs
        // handling here.
        unwrap(await deleteMyAccount(confirmation));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed';
        setError(message);
        toast.error('Delete failed', message);
      }
    });
  }

  const ready = confirmation === expectedConfirmation;

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-fg-muted">
        <span>
          Type your email <strong>({expectedConfirmation})</strong> to confirm:
        </span>
        <Input
          type="email"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
        />
      </label>
      {error && <p className="m-0 text-danger">{error}</p>}
      <Button type="submit" variant="danger" disabled={!ready || isPending} className="self-start">
        {isPending ? 'Deleting…' : 'Delete my account permanently'}
      </Button>
    </form>
  );
}
