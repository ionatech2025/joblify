'use client';

import { useApplications, type ApplicationListItem } from '@/lib/query/applications';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { EmptyState } from '@/app/components/ui/empty-state';
import { buttonClasses } from '@/app/components/ui/button';
import { applicationStatusLabel, applicationStatusTone } from '@/lib/ui/status';

export function ApplicationsList({
  userId,
  initialData,
}: {
  userId: string;
  initialData: ApplicationListItem[];
}) {
  const { data, isFetching } = useApplications(userId, initialData);
  const items = data ?? initialData;

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
                  <Badge tone={a.matchScore >= 0.7 ? 'success' : 'neutral'}>
                    Match: {Math.round(a.matchScore * 100)}%
                  </Badge>
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
      {isFetching && <li className="text-sm text-fg-subtle">Refreshing…</li>}
    </ul>
  );
}
