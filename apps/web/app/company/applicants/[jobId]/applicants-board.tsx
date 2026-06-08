'use client';

import { useMemo, useState, useTransition } from 'react';
import { updateApplicantStatus, saveApplicantNote } from '@/app/actions/update-applicant-status';
import type { ApplicationStatus } from '@prisma/client';

type Row = {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
  matchScore: number | null;
  coverLetter: string | null;
  recruiterNotes: string | null;
  resumeUrl: string;
  seeker: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    headline: string | null;
  };
};

const STAGES: { status: ApplicationStatus; label: string }[] = [
  { status: 'SUBMITTED', label: 'New' },
  { status: 'VIEWED', label: 'Viewed' },
  { status: 'SHORTLISTED', label: 'Shortlisted' },
  { status: 'INTERVIEW_SCHEDULED', label: 'Interview' },
  { status: 'OFFER_EXTENDED', label: 'Offer' },
  { status: 'HIRED', label: 'Hired' },
  { status: 'REJECTED', label: 'Rejected' },
  { status: 'WITHDRAWN', label: 'Withdrawn' },
];
const CLOSED: ApplicationStatus[] = ['HIRED', 'REJECTED', 'WITHDRAWN'];

export function ApplicantsBoard({ applications }: { applications: Row[] }) {
  const [rows, setRows] = useState(applications);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'recent' | 'match'>('recent');
  const [showClosed, setShowClosed] = useState(false);

  function changeStatus(id: string, status: ApplicationStatus) {
    const prev = rows;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    setError(null);
    startTransition(async () => {
      try {
        await updateApplicantStatus(id, status);
      } catch (err) {
        setRows(prev);
        setError(err instanceof Error ? err.message : 'Status change failed.');
      }
    });
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) =>
      sort === 'match'
        ? (b.matchScore ?? -1) - (a.matchScore ?? -1)
        : new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
    );
    return copy;
  }, [rows, sort]);

  if (rows.length === 0) return <p style={{ color: '#666' }}>No applicants yet.</p>;

  const stages = showClosed ? STAGES : STAGES.filter((s) => !CLOSED.includes(s.status));

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', margin: '1rem 0' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as 'recent' | 'match')} style={ctrl}>
            <option value="recent">Most recent</option>
            <option value="match">Highest match</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: '#555' }}>
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
          Show closed stages
        </label>
        {error && <span style={{ color: '#a00' }}>{error}</span>}
      </div>

      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', alignItems: 'flex-start' }}>
        {stages.map((stage) => {
          const items = sorted.filter((r) => r.status === stage.status);
          return (
            <div key={stage.status} style={column}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{stage.label}</span>
                <span style={{ color: '#999' }}>{items.length}</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {items.map((r) => (
                  <ApplicantCard key={r.id} row={r} onStatus={changeStatus} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ApplicantCard({ row, onStatus }: { row: Row; onStatus: (id: string, s: ApplicationStatus) => void }) {
  const [openCover, setOpenCover] = useState(false);
  const [notes, setNotes] = useState(row.recruiterNotes ?? '');
  const [baseline, setBaseline] = useState(row.recruiterNotes ?? '');
  const [noteState, setNoteState] = useState<'idle' | 'saving' | 'saved'>('idle');

  async function saveNote() {
    if (notes === baseline) return;
    setNoteState('saving');
    try {
      await saveApplicantNote(row.id, notes);
      setBaseline(notes);
      setNoteState('saved');
    } catch {
      setNoteState('idle');
    }
  }

  const name = `${row.seeker.firstName ?? ''} ${row.seeker.lastName ?? ''}`.trim() || row.seeker.email;

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline' }}>
        <strong style={{ fontSize: '0.92rem' }}>{name}</strong>
        {row.matchScore !== null && <span style={matchPill(row.matchScore)}>{Math.round(row.matchScore * 100)}%</span>}
      </div>
      {row.seeker.headline && <p style={muted}>{row.seeker.headline}</p>}
      <p style={muted}>Applied {new Date(row.appliedAt).toLocaleDateString()}</p>

      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.82rem', marginTop: '0.25rem' }}>
        <a href={row.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1856a8' }}>
          Résumé ↗
        </a>
        {row.coverLetter && (
          <button onClick={() => setOpenCover((o) => !o)} style={linkBtn}>
            {openCover ? 'Hide cover letter' : 'Cover letter'}
          </button>
        )}
      </div>

      {openCover && row.coverLetter && (
        <p
          style={{
            ...muted,
            whiteSpace: 'pre-wrap',
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: 6,
            padding: '0.5rem',
            marginTop: '0.4rem',
          }}
        >
          {row.coverLetter}
        </p>
      )}

      <select
        value={row.status}
        onChange={(e) => onStatus(row.id, e.target.value as ApplicationStatus)}
        style={{ width: '100%', padding: '0.4rem', borderRadius: 4, marginTop: '0.5rem', fontSize: '0.85rem' }}
        aria-label={`Change status for ${name}`}
      >
        {STAGES.map((s) => (
          <option key={s.status} value={s.status}>
            {s.label}
          </option>
        ))}
      </select>

      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setNoteState('idle');
        }}
        onBlur={saveNote}
        placeholder="Private notes…"
        rows={2}
        aria-label={`Notes for ${name}`}
        style={{ width: '100%', marginTop: '0.5rem', border: '1px solid #e3e3e3', borderRadius: 4, padding: '0.4rem', fontSize: '0.82rem', resize: 'vertical' }}
      />
      {noteState === 'saving' && <small style={{ color: '#999' }}>Saving…</small>}
      {noteState === 'saved' && <small style={{ color: '#137333' }}>Saved</small>}
    </div>
  );
}

function matchPill(score: number): React.CSSProperties {
  const pct = Math.round(score * 100);
  return {
    background: pct >= 70 ? '#cdeacd' : pct >= 50 ? '#fff3cd' : '#f5d9d4',
    color: pct >= 70 ? '#114411' : pct >= 50 ? '#664400' : '#8a2a1f',
    borderRadius: 999,
    padding: '0.05rem 0.45rem',
    fontSize: '0.72rem',
    fontWeight: 600,
    flexShrink: 0,
  };
}

const ctrl: React.CSSProperties = { padding: '0.4rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem' };
const column: React.CSSProperties = { flex: '0 0 280px', minWidth: 280, background: '#f7f8fa', borderRadius: 8, padding: '0.75rem' };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: '0.75rem' };
const muted: React.CSSProperties = { margin: '0.15rem 0 0', color: '#777', fontSize: '0.82rem' };
const linkBtn: React.CSSProperties = { background: 'transparent', border: 0, color: '#1856a8', cursor: 'pointer', padding: 0, fontSize: '0.82rem' };
