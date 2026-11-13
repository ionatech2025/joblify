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
import { companySizeLabel, industryLabel } from '@/lib/ui/status';
import { focusAfterRemoving, ReasonForm, useFocusAfterRender } from './decision';

export type PendingCompany = {
  id: string;
  companyName: string;
  industry: string;
  companySize: string;
  description: string;
  website: string | null;
  address: string | null;
  phone: string | null;
  contactPersonName: string | null;
  contactPersonPosition: string | null;
  createdAt: string;
};

const verifyId = (c: PendingCompany) => `verify-${c.id}`;

export function VerificationQueue({
  initial,
  headingId,
}: {
  initial: PendingCompany[];
  headingId: string;
}) {
  const [rows, setRows] = useState(initial);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const focus = useFocusAfterRender();

  function decide(id: string, status: 'VERIFIED' | 'REJECTED', reason?: string) {
    setError(null);
    setRejecting(null);
    const prev = rows;
    focus(focusAfterRemoving(prev, id, verifyId, headingId));
    setRows((r) => r.filter((row) => row.id !== id)); // optimistic
    const name = prev.find((row) => row.id === id)?.companyName ?? 'Company';
    startTransition(async () => {
      try {
        unwrap(await verifyCompany(id, status, reason));
        if (status === 'VERIFIED') {
          toast.success(`${name} verified`, 'They now appear in search and the directory.');
        } else {
          toast.success(`${name} rejected`, 'They have been emailed the reason.');
        }
      } catch (err) {
        setRows(prev);
        const message = err instanceof Error ? err.message : 'Action failed.';
        setError(message);
        toast.error(`Couldn't update ${name}`, message);
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
      cell: (c) => <CompanyDetails company={c} />,
      aggregate: (r) => `${r.length} awaiting review`,
    },
    {
      key: 'industry',
      header: 'Industry',
      hideBelow: 'sm',
      cell: (c) => <span className="text-fg-muted">{industryLabel(c.industry)}</span>,
    },
    {
      key: 'size',
      header: 'Size',
      hideBelow: 'sm',
      cell: (c) => <span className="text-fg-muted">{companySizeLabel(c.companySize)}</span>,
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
      cell: (c) =>
        rejecting === c.id ? (
          <ReasonForm
            label={`Reason for rejecting ${c.companyName}`}
            hint="The company sees this and uses it to fix their details."
            submitLabel="Reject"
            onSubmit={(reason) => decide(c.id, 'REJECTED', reason)}
            onCancel={() => {
              focus(`reject-${c.id}`);
              setRejecting(null);
            }}
          />
        ) : (
          <div className="flex justify-end gap-1.5">
            <Button
              id={verifyId(c)}
              type="button"
              size="sm"
              onClick={() => decide(c.id, 'VERIFIED')}
            >
              Verify
            </Button>
            <Button
              id={`reject-${c.id}`}
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setRejecting(c.id)}
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

function CompanyDetails({ company: c }: { company: PendingCompany }) {
  const contact = [c.contactPersonName, c.contactPersonPosition].filter(Boolean).join(', ');
  const facts: [string, React.ReactNode][] = [
    ['Website', c.website ? <WebsiteLink href={c.website} /> : null],
    ['Contact', contact || null],
    ['Phone', c.phone],
    ['Address', c.address],
  ];
  return (
    <div className="min-w-0 max-w-xl">
      <span className="text-fg font-medium">{c.companyName}</span>
      <p className="text-fg-muted mt-1 mb-0 text-[12px] whitespace-pre-wrap">{c.description}</p>
      <dl className="mt-1.5 mb-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-[12px]">
        {facts.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-fg-subtle">{label}</dt>
            <dd className="text-fg-muted m-0 break-words">{value ?? 'Not given'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function WebsiteLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand underline">
      {href.replace(/^https?:\/\//, '')}
    </a>
  );
}
