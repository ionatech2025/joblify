'use client';

import { useApplications, type ApplicationListItem } from '@/lib/query/applications';
import Link from 'next/link';
import { Badge } from '@/app/components/ui/badge';

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Submitted',
  VIEWED: 'Viewed',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview scheduled',
  OFFER_EXTENDED: 'Offer extended',
  HIRED: 'Hired',
  REJECTED: 'Not selected',
  WITHDRAWN: 'Withdrawn',
};

// Semantic status tones: progress/outcome wins are success, "not selected"
// warns, everything else stays neutral.
const STATUS_TONE: Record<string, 'success' | 'warn' | 'neutral'> = {
  SHORTLISTED: 'success',
  INTERVIEW_SCHEDULED: 'success',
  OFFER_EXTENDED: 'success',
  HIRED: 'success',
  REJECTED: 'warn',
};

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
      <p className="text-neutral-600">
        You haven&apos;t applied to any jobs yet.{' '}
        <Link href="/jobs" className="text-indigo-700 hover:underline">
          Find a role
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="grid list-none grid-cols-1 gap-3 p-0">
      {items.map((a) => (
        <li key={a.id} className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-baseline justify-between gap-4">
            <div className="min-w-0">
              <Link href={`/jobs/${a.slug}`} className="font-semibold text-neutral-900 hover:underline">
                {a.jobTitle}
              </Link>
              <p className="mt-1 mb-0 text-neutral-600">{a.companyName}</p>
            </div>
            <div className="shrink-0 text-right">
              <Badge tone={STATUS_TONE[a.status] ?? 'neutral'}>{STATUS_LABEL[a.status] ?? a.status}</Badge>
              <p className="mt-1 mb-0 text-sm text-neutral-500">{new Date(a.appliedAt).toLocaleDateString()}</p>
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
      {isFetching && <li className="text-sm text-neutral-500">Refreshing…</li>}
    </ul>
  );
}
