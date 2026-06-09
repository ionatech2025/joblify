'use client';

import { useApplications, type ApplicationListItem } from '@/lib/query/applications';
import Link from 'next/link';

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

const STATUS_CLASS: Record<string, string> = {
  HIRED: 'bg-green-100 text-green-800',
  OFFER_EXTENDED: 'bg-green-50 text-green-700',
  SHORTLISTED: 'bg-blue-50 text-blue-700',
  INTERVIEW_SCHEDULED: 'bg-blue-50 text-blue-700',
  REJECTED: 'bg-red-50 text-red-700',
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
        <li key={a.id} className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-baseline justify-between gap-4">
            <div className="min-w-0">
              <Link href={`/jobs/${a.slug}`} className="font-semibold text-neutral-900 hover:underline">
                {a.jobTitle}
              </Link>
              <p className="mt-1 mb-0 text-neutral-600">{a.companyName}</p>
            </div>
            <div className="shrink-0 text-right">
              <span
                className={`inline-block rounded px-2 py-0.5 text-sm font-medium ${STATUS_CLASS[a.status] ?? 'bg-neutral-100 text-neutral-600'}`}
              >
                {STATUS_LABEL[a.status] ?? a.status}
              </span>
              <p className="mt-1 mb-0 text-sm text-neutral-500">{new Date(a.appliedAt).toLocaleDateString()}</p>
              {a.matchScore !== null && (
                <p className="mt-1 mb-0 text-sm text-neutral-700">
                  Match: <strong>{Math.round(a.matchScore * 100)}%</strong>
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
