'use client';

import { useState, useTransition } from 'react';
import { deleteMyAccount } from '@/app/actions/account';
import { Input } from '@/app/components/ui/form';

export function DeleteForm({ expectedConfirmation }: { expectedConfirmation: string }) {
  const [confirmation, setConfirmation] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await deleteMyAccount(confirmation);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed');
      }
    });
  }

  const ready = confirmation === expectedConfirmation;

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-neutral-700">
        <span>
          Type your email <strong>({expectedConfirmation})</strong> to confirm:
        </span>
        <Input type="email" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="off" />
      </label>
      {error && <p className="m-0 text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={!ready || isPending}
        className="self-start rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {isPending ? 'Deleting…' : 'Delete my account permanently'}
      </button>
    </form>
  );
}
