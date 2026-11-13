'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Flag } from 'lucide-react';
import { resolveJobReport } from '@/app/actions/admin';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { EmptyState } from '@/app/components/ui/empty-state';
import { ListView, type ListColumn } from '@/app/components/console/list-view';
import { TimeStamp } from '@/app/components/ui/timestamp';
import { unwrap } from '@/lib/action-result';
import { toast } from '@/lib/stores/ui';
import { focusAfterRemoving, ReasonForm, useFocusAfterRender } from './decision';

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

const dismissId = (r: OpenReport) => `dismiss-${r.id}`;

export function JobReportsQueue({
  initial,
  headingId,
}: {
  initial: OpenReport[];
  headingId: string;
}) {
  const [rows, setRows] = useState(initial);
  const [removing, setRemoving] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const focus = useFocusAfterRender();

  function decide(
    report: OpenReport,
    resolution: { outcome: 'ACTIONED'; reason: string } | { outcome: 'DISMISSED' },
  ) {
    setRemoving(null);
    const prev = rows;
    focus(focusAfterRemoving(prev, report.id, dismissId, headingId));
    setRows((r) => r.filter((x) => x.id !== report.id)); // optimistic
    startTransition(async () => {
      try {
        unwrap(await resolveJobReport(report.id, resolution));
        toast.success(resolution.outcome === 'ACTIONED' ? 'Job removed' : 'Report dismissed');
      } catch (err) {
        setRows(prev);
        toast.error(
          "Couldn't resolve that report",
          err instanceof Error ? err.message : 'Try again.',
        );
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

  const columns: ListColumn<OpenReport>[] = [
    {
      key: 'job',
      header: 'Posting',
      cell: (r) => (
        <div className="min-w-0">
          <Link
            href={`/jobs/${r.jobSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg font-semibold no-underline hover:underline"
          >
            {r.jobTitle}
          </Link>
          <span className="text-fg-muted ml-1.5 text-[12px]">· {r.companyName}</span>
          {r.details ? (
            <p className="text-fg-muted mt-1 mb-0 max-w-xl text-[12px] whitespace-pre-wrap">
              {r.details}
            </p>
          ) : null}
        </div>
      ),
      aggregate: () => `${rows.length} open report${rows.length === 1 ? '' : 's'}`,
    },
    {
      key: 'reason',
      header: 'Reason',
      cell: (r) => (
        <Badge tone={r.reason === 'SCAM' || r.reason === 'DISCRIMINATORY' ? 'danger' : 'warn'}>
          {REASON_LABEL[r.reason] ?? r.reason}
        </Badge>
      ),
    },
    {
      key: 'reported',
      header: 'Reported',
      align: 'end',
      hideBelow: 'sm',
      cell: (r) => <TimeStamp value={r.createdAt} className="text-fg-muted" />,
    },
    {
      key: 'actions',
      header: 'Decision',
      align: 'end',
      cell: (r) =>
        removing === r.id ? (
          <ReasonForm
            label={`Reason for removing ${r.jobTitle}`}
            hint="Kept in the audit log. The company and every applicant are told it was removed."
            submitLabel="Remove job"
            onSubmit={(reason) => decide(r, { outcome: 'ACTIONED', reason })}
            onCancel={() => {
              focus(`remove-${r.id}`);
              setRemoving(null);
            }}
          />
        ) : (
          <div className="flex justify-end gap-1.5">
            <Button
              id={dismissId(r)}
              size="sm"
              variant="secondary"
              onClick={() => decide(r, { outcome: 'DISMISSED' })}
            >
              Dismiss
            </Button>
            <Button
              id={`remove-${r.id}`}
              size="sm"
              variant="danger"
              onClick={() => setRemoving(r.id)}
            >
              Remove job
            </Button>
          </div>
        ),
    },
  ];

  return (
    <ListView caption="Reported job postings" rows={rows} rowKey={(r) => r.id} columns={columns} />
  );
}
