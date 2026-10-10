'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Flag } from 'lucide-react';
import { resolveJobReport } from '@/app/actions/admin';
import { Button } from '@/app/components/ui/button';
import { EmptyState } from '@/app/components/ui/empty-state';
import { TimeStamp } from '@/app/components/ui/timestamp';
import { unwrap } from '@/lib/action-result';
import { toast } from '@/lib/stores/ui';

export type OpenReport = {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  jobTitle: string;
  jobSlug: string;
  companyName: string;
};

const REASON_LABEL: Record<string, string> = {
  SCAM: 'Scam / asks for money',
  DISCRIMINATORY: 'Discriminatory',
  MISLEADING: 'Misleading',
  DUPLICATE: 'Duplicate',
  OTHER: 'Other',
};

export function JobReportsQueue({ initial }: { initial: OpenReport[] }) {
  const [rows, setRows] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function decide(report: OpenReport, outcome: 'ACTIONED' | 'DISMISSED') {
    if (
      outcome === 'ACTIONED' &&
      !window.confirm(`Remove “${report.jobTitle}”? The company is notified and it leaves search.`)
    ) {
      return;
    }
    const prev = rows;
    setBusyId(report.id);
    setRows((r) => r.filter((x) => x.id !== report.id)); // optimistic
    startTransition(async () => {
      try {
        unwrap(await resolveJobReport(report.id, outcome));
        toast.success(outcome === 'ACTIONED' ? 'Job removed' : 'Report dismissed');
      } catch (err) {
        setRows(prev);
        toast.error(
          "Couldn't resolve that report",
          err instanceof Error ? err.message : 'Try again.',
        );
      } finally {
        setBusyId(null);
      }
    });
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Flag />}
        title="No open reports"
        description="Postings that users flag as scams, discriminatory or misleading land here for review."
      />
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {rows.map((r) => (
        <li
          key={r.id}
          className="rounded-card border-border bg-surface flex flex-wrap items-start justify-between gap-3 border p-3"
        >
          <div className="min-w-0">
            <p className="text-fg m-0 text-sm font-semibold">
              <Link href={`/jobs/${r.jobSlug}`} target="_blank" rel="noopener noreferrer">
                {r.jobTitle}
              </Link>{' '}
              <span className="text-fg-muted font-normal">· {r.companyName}</span>
            </p>
            <p className="text-fg-muted mt-0.5 mb-0 text-[13px]">
              {REASON_LABEL[r.reason] ?? r.reason} · reported <TimeStamp value={r.createdAt} />
            </p>
            {r.details ? (
              <p className="text-fg mt-1 mb-0 text-[13px] whitespace-pre-wrap">{r.details}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busyId === r.id}
              onClick={() => decide(r, 'DISMISSED')}
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={busyId === r.id}
              onClick={() => decide(r, 'ACTIONED')}
            >
              Remove job
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
