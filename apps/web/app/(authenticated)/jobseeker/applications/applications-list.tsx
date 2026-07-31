'use client';

import {
  useApplications,
  useWithdrawApplication,
  type ApplicationListItem,
} from '@/lib/query/applications';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { EmptyState } from '@/app/components/ui/empty-state';
import { buttonClasses } from '@/app/components/ui/button';
import {
  applicationStatusLabel,
  applicationStatusTone,
  matchTone,
  CLOSED_APPLICATION_STATUSES,
} from '@/lib/ui/status';
import { toast } from '@/lib/stores/ui';

export function ApplicationsList({
  userId,
  initialData,
}: {
  userId: string;
  initialData: ApplicationListItem[];
}) {
  const { data, isFetching } = useApplications(userId, initialData);
  const withdraw = useWithdrawApplication(userId);
  const items = data ?? initialData;

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

  if (items.length === 0) {
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

  return (
    <ul className="grid list-none grid-cols-1 gap-3 p-0">
      {items.map((a) => (
        <li key={a.id} className="rounded-card border border-border bg-surface p-4 shadow-soft">
          <div className="flex items-baseline justify-between gap-4">
            <div className="min-w-0">
              <Link href={`/jobs/${a.slug}`} className="font-semibold text-fg hover:underline">
                {a.jobTitle}
              </Link>
              <p className="mt-1 mb-0 text-fg-muted">{a.companyName}</p>
            </div>
            <div className="shrink-0 text-right">
              <Badge tone={applicationStatusTone(a.status)}>
                {applicationStatusLabel(a.status)}
              </Badge>
              <p className="mt-1 mb-0 text-sm text-fg-subtle">
                {new Date(a.appliedAt).toLocaleDateString()}
              </p>
              {a.matchScore !== null && (
                <p className="mt-1 mb-0">
                  <Badge tone={matchTone(a.matchScore)}>
                    Match: {Math.round(a.matchScore * 100)}%
                  </Badge>
                </p>
              )}
              {!CLOSED_APPLICATION_STATUSES.includes(a.status) && (
                <button
                  type="button"
                  onClick={() => onWithdraw(a)}
                  disabled={withdraw.isPending}
                  className="mt-2 text-sm text-danger hover:underline disabled:opacity-50"
                >
                  Withdraw
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
      {isFetching && <li className="text-sm text-fg-subtle">Refreshing…</li>}
    </ul>
  );
}
