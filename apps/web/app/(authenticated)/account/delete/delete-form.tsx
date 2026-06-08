'use client';

import { useState, useTransition } from 'react';
import { deleteMyAccount } from '@/app/actions/account';

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
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
      <label>
        Type your email <strong>({expectedConfirmation})</strong> to confirm:
        <input
          type="email"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
          style={{ display: 'block', marginTop: '0.5rem', padding: '0.6rem', width: '100%', border: '1px solid #ccc', borderRadius: 6 }}
        />
      </label>
      {error && <p style={{ color: '#a00', margin: 0 }}>{error}</p>}
      <button
        type="submit"
        disabled={!ready || isPending}
        style={{
          padding: '0.75rem 1.25rem',
          background: ready ? '#a00' : '#ccc',
          color: 'white',
          borderRadius: 8,
          border: 0,
          fontWeight: 600,
          cursor: ready && !isPending ? 'pointer' : 'not-allowed',
        }}
      >
        {isPending ? 'Deleting…' : 'Delete my account permanently'}
      </button>
    </form>
  );
}
