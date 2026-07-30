'use client';

import { useState, useTransition } from 'react';
import { verifyCompany } from '@/app/actions/admin';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { EmptyState } from '@/app/components/ui/empty-state';
import { toast } from '@/lib/stores/ui';

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
    if (status === 'REJECTED' && !window.confirm('Reject this company? They will be notified.'))
      return;
    setError(null);
    setBusyId(id);
    const prev = rows;
    setRows((r) => r.filter((row) => row.id !== id)); // optimistic
    const name = prev.find((row) => row.id === id)?.companyName ?? 'Company';
    startTransition(async () => {
      try {
        await verifyCompany(id, status);
        if (status === 'VERIFIED') {
          toast.success(`${name} verified`, 'They now appear in search and the directory.');
        } else {
          toast.success(`${name} rejected`, 'They have been notified.');
        }
      } catch (err) {
        setRows(prev);
        const message = err instanceof Error ? err.message : 'Action failed.';
        setError(message);
        toast.error(`Couldn't update ${name}`, message);
      } finally {
        setBusyId(null);
      }
    });
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        className="mt-6"
        icon={<ShieldCheck />}
        title="Verification queue is clear"
        description="Newly registered companies appear here for review before they show in search and the directory."
      />
    );
  }

  return (
    <div className="mt-6">
      {error && <p className="mb-4 text-danger">{error}</p>}
      <ul className="grid list-none grid-cols-1 gap-3 p-0">
        {rows.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface p-4 shadow-soft"
          >
            <div>
              <p className="m-0 font-semibold text-fg">{c.companyName}</p>
              <p className="mt-1 mb-0 text-sm text-fg-subtle">
                {titleCase(c.industry)} · {sizeLabel(c.companySize)}
                {c.website && (
                  <>
                    {' · '}
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand underline"
                    >
                      {c.website}
                    </a>
                  </>
                )}
              </p>
              <p className="mt-1 mb-0 text-xs text-fg-subtle">
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
