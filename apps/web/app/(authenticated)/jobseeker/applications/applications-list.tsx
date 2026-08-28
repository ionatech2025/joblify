'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import {
  useApplications,
  useWithdrawApplication,
  type ApplicationListItem,
} from '@/lib/query/applications';
import { Badge } from '@/app/components/ui/badge';
import { EmptyState } from '@/app/components/ui/empty-state';
import { buttonClasses } from '@/app/components/ui/button';
import { ListView, type ListColumn } from '@/app/components/console/list-view';
import {
  applicationStatusLabel,
  applicationStatusTone,
  matchTone,
  CLOSED_APPLICATION_STATUSES,
} from '@/lib/ui/status';
import { toast } from '@/lib/stores/ui';
import { TimeStamp } from '@/app/components/ui/timestamp';

/**
 * The jobseeker's application pipeline, as a dense list rather than a stack of
 * cards — one row per application instead of one 100px card, so a real history
 * fits on a screen.
 *
 * Filtering is read from the URL, and *written* by the control-panel filter
 * menu the page renders server-side. The rows themselves stay in the react-query
 * cache because this list refetches in the background and withdraws
 * optimistically; the filter is applied over that cache rather than refetched,
 * since it is one user's own applications and already all in memory.
 */
export function ApplicationsList({
  userId,
  initialData,
  total,
}: {
  userId: string;
  initialData: ApplicationListItem[];
  /** Total the user actually has, so a truncated load can say so. */
  total: number;
}) {
  const { data, isFetching } = useApplications(userId, initialData);
  const withdraw = useWithdrawApplication(userId);
  const searchParams = useSearchParams();
  const loaded = data ?? initialData;

  const statusFilter = searchParams.get('status') ?? '';
  const items = statusFilter ? loaded.filter((a) => a.status === statusFilter) : loaded;

  function onWithdraw(a: ApplicationListItem) {
    if (
      !window.confirm(
        `Withdraw your application for ${a.jobTitle}? This can't be undone — you'd need to re-apply to be considered again.`,
      )
    ) {
      return;
    }
    withdraw.mutate(a.id, {
      onSuccess: () => toast.success('Application withdrawn'),
      onError: (err) =>
        toast.error(
          "Couldn't withdraw",
          err instanceof Error ? err.message : 'Something went wrong.',
        ),
    });
  }

  if (loaded.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase />}
        title="No applications yet"
        description="Every role you apply to shows up here, with its status as the company moves it through their pipeline."
        action={
          <Link href="/jobs" className={`${buttonClasses()} no-underline`}>
            Find a role
          </Link>
        }
      />
    );
  }

  const columns: ListColumn<ApplicationListItem>[] = [
    {
      key: 'role',
      header: 'Role',
      cell: (a) => (
        <Link href={`/jobs/${a.slug}`} className="text-fg font-medium no-underline hover:underline">
          {a.jobTitle}
        </Link>
      ),
      aggregate: () => `${items.length} shown`,
    },
    {
      key: 'company',
      header: 'Company',
      hideBelow: 'sm',
      cell: (a) => <span className="text-fg-muted">{a.companyName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (a) => (
        <Badge tone={applicationStatusTone(a.status)}>{applicationStatusLabel(a.status)}</Badge>
      ),
    },
    {
      key: 'match',
      header: 'Match',
      align: 'end',
      hideBelow: 'md',
      cell: (a) =>
        a.matchScore === null ? (
          <span className="text-fg-subtle">—</span>
        ) : (
          <Badge tone={matchTone(a.matchScore)}>{Math.round(a.matchScore * 100)}%</Badge>
        ),
    },
    {
      key: 'applied',
      header: 'Applied',
      align: 'end',
      hideBelow: 'sm',
      cell: (a) => <TimeStamp value={a.appliedAt} className="text-fg-muted" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (a) =>
        CLOSED_APPLICATION_STATUSES.includes(a.status) ? null : (
          <button
            type="button"
            onClick={() => onWithdraw(a)}
            disabled={withdraw.isPending}
            className="text-danger hover:underline disabled:opacity-50"
          >
            Withdraw
          </button>
        ),
    },
  ];

  return (
    <>
      {total > loaded.length && (
        <p className="text-warn bg-warn-subtle rounded-card border-warn/25 mb-2 border px-2.5 py-1.5 text-[12px]">
          Showing your {loaded.length} most recent applications of {total}. Filter by status to
          narrow the list.
        </p>
      )}
      {items.length === 0 ? (
        <EmptyState
          icon={<Briefcase />}
          title="No applications at this status"
          description="Nothing in your history matches that filter yet."
          action={
            <Link href="/jobseeker/applications" className={`${buttonClasses()} no-underline`}>
              Clear filter
            </Link>
          }
        />
      ) : (
        <ListView caption="My applications" rows={items} rowKey={(a) => a.id} columns={columns} />
      )}
      <p aria-live="polite" className="text-fg-subtle mt-1 h-4 text-[12px]">
        {isFetching ? 'Refreshing…' : ''}
      </p>
    </>
  );
}
