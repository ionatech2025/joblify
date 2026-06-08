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

const controlClass = 'rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm';

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

  if (rows.length === 0) return <p className="text-neutral-600">No applicants yet.</p>;

  const stages = showClosed ? STAGES : STAGES.filter((s) => !CLOSED.includes(s.status));

  return (
    <>
      <div className="my-4 flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as 'recent' | 'match')} className={controlClass}>
            <option value="recent">Most recent</option>
            <option value="match">Highest match</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
          Show closed stages
        </label>
        {error && <span className="text-red-700">{error}</span>}
      </div>

      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const items = sorted.filter((r) => r.status === stage.status);
          return (
            <div key={stage.status} className="w-[280px] shrink-0 rounded-xl bg-neutral-50 p-3">
              <h3 className="mb-3 flex justify-between text-sm font-semibold text-neutral-900">
                <span>{stage.label}</span>
                <span className="text-neutral-400">{items.length}</span>
              </h3>
              <div className="flex flex-col gap-2.5">
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
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <div className="flex items-baseline justify-between gap-2">
        <strong className="text-sm">{name}</strong>
        {row.matchScore !== null && <span className={matchPill(row.matchScore)}>{Math.round(row.matchScore * 100)}%</span>}
      </div>
      {row.seeker.headline && <p className="mt-0.5 mb-0 text-xs text-neutral-500">{row.seeker.headline}</p>}
      <p className="mt-0.5 mb-0 text-xs text-neutral-500">Applied {new Date(row.appliedAt).toLocaleDateString()}</p>

      <div className="mt-1 flex gap-3 text-xs">
        <a href={row.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
          Résumé ↗
        </a>
        {row.coverLetter && (
          <button onClick={() => setOpenCover((o) => !o)} className="text-blue-700 hover:underline">
            {openCover ? 'Hide cover letter' : 'Cover letter'}
          </button>
        )}
      </div>

      {openCover && row.coverLetter && (
        <p className="mt-1 mb-0 whitespace-pre-wrap rounded-md border border-neutral-200 bg-white p-2 text-xs text-neutral-600">
          {row.coverLetter}
        </p>
      )}

      <select
        value={row.status}
        onChange={(e) => onStatus(row.id, e.target.value as ApplicationStatus)}
        className="mt-2 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
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
        className="mt-2 w-full resize-y rounded border border-neutral-200 px-2 py-1.5 text-xs"
      />
      {noteState === 'saving' && <small className="text-neutral-400">Saving…</small>}
      {noteState === 'saved' && <small className="text-green-700">Saved</small>}
    </div>
  );
}

function matchPill(score: number): string {
  const pct = Math.round(score * 100);
  const tone =
    pct >= 70 ? 'bg-green-100 text-green-800' : pct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
  return `shrink-0 rounded-full px-1.5 py-0.5 text-xs font-semibold ${tone}`;
}
