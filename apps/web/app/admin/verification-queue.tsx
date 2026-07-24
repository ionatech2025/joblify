'use client';

import { useState, useTransition } from 'react';
import { verifyCompany } from '@/app/actions/admin';
import { Button } from '@/app/components/ui/button';

type PendingCompany = {
  id: string;
  companyName: string;
  industry: string;
  companySize: string;
  website: string | null;
  createdAt: string;
};

export function VerificationQueue({ initial }: { initial: PendingCompany[] }) {
  const [rows, setRows] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(id: string, status: 'VERIFIED' | 'REJECTED') {
    if (status === 'REJECTED' && !window.confirm('Reject this company? They will be notified.')) return;
    setError(null);
    setBusyId(id);
    const prev = rows;
    setRows((r) => r.filter((row) => row.id !== id)); // optimistic
    startTransition(async () => {
      try {
        await verifyCompany(id, status);
      } catch (err) {
        setRows(prev);
        setError(err instanceof Error ? err.message : 'Action failed.');
      } finally {
        setBusyId(null);
      }
    });
  }

  if (rows.length === 0) {
    return <p className="mt-6 text-neutral-600">No companies waiting on verification.</p>;
  }

  return (
    <div className="mt-6">
      {error && <p className="mb-4 text-red-700">{error}</p>}
      <ul className="grid list-none grid-cols-1 gap-3 p-0">
        {rows.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-soft">
            <div>
              <p className="m-0 font-semibold text-neutral-900">{c.companyName}</p>
              <p className="mt-1 mb-0 text-sm text-neutral-500">
                {titleCase(c.industry)} · {sizeLabel(c.companySize)}
                {c.website && (
                  <>
                    {' · '}
                    <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:underline">
                      {c.website}
                    </a>
                  </>
                )}
              </p>
              <p className="mt-1 mb-0 text-xs text-neutral-400">
                Applied {new Date(c.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={busyId === c.id}
                onClick={() => decide(c.id, 'VERIFIED')}
              >
                Verify
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={busyId === c.id}
                onClick={() => decide(c.id, 'REJECTED')}
              >
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function sizeLabel(size: string): string {
  return size.replace('SIZE_', '').replace(/_/g, '–').replace('PLUS', '+');
}
