'use client';

import { useState, useTransition } from 'react';
import { verifyCompany } from '@/app/actions/admin';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { EmptyState } from '@/app/components/ui/empty-state';
import { ListView, type ListColumn } from '@/app/components/console/list-view';
import { toast } from '@/lib/stores/ui';
import { unwrap } from '@/lib/action-result';
import { TimeStamp } from '@/app/components/ui/timestamp';

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
        unwrap(await verifyCompany(id, status));
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
        icon={<ShieldCheck />}
        title="Verification queue is clear"
        description="Newly registered companies appear here for review before they show in search and the directory."
      />
    );
  }

  const columns: ListColumn<PendingCompany>[] = [
    {
      key: 'company',
      header: 'Company',
      cell: (c) => <span className="text-fg font-medium">{c.companyName}</span>,
      aggregate: (r) => `${r.length} awaiting review`,
    },
    {
      key: 'industry',
      header: 'Industry',
      hideBelow: 'sm',
      cell: (c) => <span className="text-fg-muted">{titleCase(c.industry)}</span>,
    },
    {
      key: 'size',
      header: 'Size',
      hideBelow: 'sm',
      cell: (c) => <span className="text-fg-muted">{sizeLabel(c.companySize)}</span>,
    },
    {
      key: 'website',
      header: 'Website',
      hideBelow: 'md',
      cell: (c) =>
        c.website ? (
          <a
            href={c.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            {c.website.replace(/^https?:\/\//, '')}
          </a>
        ) : (
          <span className="text-fg-subtle">—</span>
        ),
    },
    {
      key: 'applied',
      header: 'Applied',
      align: 'end',
      hideBelow: 'sm',
      cell: (c) => <TimeStamp value={c.createdAt} className="text-fg-muted" />,
    },
    {
      key: 'actions',
      header: 'Decision',
      align: 'end',
      cell: (c) => (
        <div className="flex justify-end gap-1.5">
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
      ),
    },
  ];

  return (
    <>
      {error && (
        <p role="alert" className="text-danger mb-2 text-[13px]">
          {error}
        </p>
      )}
      <ListView
        caption="Company verification queue"
        rows={rows}
        rowKey={(c) => c.id}
        columns={columns}
      />
    </>
  );
}

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function sizeLabel(size: string): string {
  return size.replace('SIZE_', '').replace(/_/g, '–').replace('PLUS', '+');
}
