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
      <p style={{ color: '#666' }}>
        You haven't applied to any jobs yet. <Link href="/jobs">Find a role</Link>.
      </p>
    );
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
      {items.map((a) => (
        <li key={a.id} style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: '1rem', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
            <div>
              <Link href={`/jobs/${a.jobPostId}`} style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}>
                {a.jobTitle}
              </Link>
              <p style={{ margin: '0.25rem 0 0', color: '#666' }}>{a.companyName}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={statusStyle(a.status)}>{STATUS_LABEL[a.status] ?? a.status}</span>
              <p style={{ margin: '0.25rem 0 0', color: '#888', fontSize: '0.85rem' }}>
                {new Date(a.appliedAt).toLocaleDateString()}
              </p>
              {a.matchScore !== null && (
                <p style={{ margin: '0.25rem 0 0', color: '#444', fontSize: '0.85rem' }}>
                  Match: <strong>{Math.round(a.matchScore * 100)}%</strong>
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
      {isFetching && <li style={{ color: '#888' }}>Refreshing…</li>}
    </ul>
  );
}

function statusStyle(status: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: 4,
    fontSize: '0.85rem',
    fontWeight: 500,
  };
  switch (status) {
    case 'HIRED':
      return { ...base, background: '#cdeacd', color: '#114411' };
    case 'OFFER_EXTENDED':
      return { ...base, background: '#dff0d8', color: '#225522' };
    case 'SHORTLISTED':
    case 'INTERVIEW_SCHEDULED':
      return { ...base, background: '#e7f3ff', color: '#1856a8' };
    case 'REJECTED':
      return { ...base, background: '#f5d9d4', color: '#8a2a1f' };
    default:
      return { ...base, background: '#eee', color: '#555' };
  }
}
