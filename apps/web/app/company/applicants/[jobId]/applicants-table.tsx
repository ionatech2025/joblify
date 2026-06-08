'use client';

import { useState, useTransition } from 'react';
import { updateApplicantStatus } from '@/app/actions/update-applicant-status';
import type { ApplicationStatus } from '@prisma/client';

type Row = {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
  matchScore: number | null;
  coverLetter: string | null;
  resumeUrl: string;
  seeker: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    headline: string | null;
  };
};

const STATUSES: ApplicationStatus[] = [
  'SUBMITTED',
  'VIEWED',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'OFFER_EXTENDED',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
];

export function ApplicantsTable({ applications }: { applications: Row[] }) {
  const [rows, setRows] = useState(applications);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function changeStatus(applicationId: string, status: ApplicationStatus) {
    const prev = rows;
    setRows((r) => r.map((row) => (row.id === applicationId ? { ...row, status } : row)));
    startTransition(async () => {
      try {
        await updateApplicantStatus(applicationId, status);
      } catch (err) {
        setRows(prev);
        setError(err instanceof Error ? err.message : 'Status change failed.');
      }
    });
  }

  if (rows.length === 0) return <p style={{ color: '#666' }}>No applicants yet.</p>;

  return (
    <>
      {error && <p style={{ color: '#a00' }}>{error}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th style={th}>Candidate</th>
            <th style={th}>Match</th>
            <th style={th}>Status</th>
            <th style={th}>Applied</th>
            <th style={th}>Resume</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={td}>
                <strong>
                  {r.seeker.firstName ?? ''} {r.seeker.lastName ?? ''}
                </strong>
                <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>{r.seeker.email}</p>
                {r.seeker.headline && (
                  <p style={{ margin: 0, color: '#444', fontSize: '0.85rem' }}>{r.seeker.headline}</p>
                )}
              </td>
              <td style={td}>{r.matchScore !== null ? `${Math.round(r.matchScore * 100)}%` : '—'}</td>
              <td style={td}>
                <select
                  value={r.status}
                  onChange={(e) => changeStatus(r.id, e.target.value as ApplicationStatus)}
                  disabled={isPending}
                  style={{ padding: '0.4rem', borderRadius: 4 }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </td>
              <td style={td}>{new Date(r.appliedAt).toLocaleDateString()}</td>
              <td style={td}>
                <a href={r.resumeUrl} target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #ddd', fontSize: '0.9rem', color: '#555' };
const td: React.CSSProperties = { padding: '0.75rem 0.5rem', verticalAlign: 'top' };
