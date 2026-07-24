'use client';

import { useMemo, useState, useTransition } from 'react';
import { updateApplicantStatus, saveApplicantNote } from '@/app/actions/update-applicant-status';
import type { ApplicationStatus } from '@prisma/client';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';
import { Select, Textarea } from '@/app/components/ui/form';

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

  if (rows.length === 0) return <p className="text-neutral-600">No applicants yet.</p>;

  const stages = showClosed ? STAGES : STAGES.filter((s) => !CLOSED.includes(s.status));

  return (
    <>
      <div className="my-4 flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          Sort
          <span className="block w-44">
            <Select value={sort} onChange={(e) => setSort(e.target.value as 'recent' | 'match')}>
              <option value="recent">Most recent</option>
              <option value="match">Highest match</option>
            </Select>
          </span>
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
            <Card key={stage.status} tone="glass" className="w-[280px] shrink-0">
              <h3 className="mt-0 mb-3 flex justify-between text-sm font-semibold text-neutral-900">
                <span>{stage.label}</span>
                <span className="text-neutral-400">{items.length}</span>
              </h3>
              <div className="flex flex-col gap-2.5">
                {items.map((r) => (
                  <ApplicantCard key={r.id} row={r} onStatus={changeStatus} />
                ))}
              </div>
            </Card>
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
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-soft">
      <div className="flex items-baseline justify-between gap-2">
        <strong className="text-sm">{name}</strong>
        {row.matchScore !== null && (
          <Badge tone={matchTone(row.matchScore)} className="shrink-0">
            {Math.round(row.matchScore * 100)}%
          </Badge>
        )}
      </div>
      {row.seeker.headline && <p className="mt-0.5 mb-0 text-xs text-neutral-500">{row.seeker.headline}</p>}
      <p className="mt-0.5 mb-0 text-xs text-neutral-500">Applied {new Date(row.appliedAt).toLocaleDateString()}</p>

      <div className="mt-1 flex gap-3 text-xs">
        <a href={row.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:underline">
          Résumé ↗
        </a>
        {row.coverLetter && (
          <button onClick={() => setOpenCover((o) => !o)} className="text-indigo-700 hover:underline">
            {openCover ? 'Hide cover letter' : 'Cover letter'}
          </button>
        )}
      </div>

      {openCover && row.coverLetter && (
        <p className="mt-1 mb-0 whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-2 text-xs text-neutral-600">
          {row.coverLetter}
        </p>
      )}

      <Select
        value={row.status}
        onChange={(e) => onStatus(row.id, e.target.value as ApplicationStatus)}
        className="mt-2"
        aria-label={`Change status for ${name}`}
      >
        {STAGES.map((s) => (
          <option key={s.status} value={s.status}>
            {s.label}
          </option>
        ))}
      </Select>

      <Textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setNoteState('idle');
        }}
        onBlur={saveNote}
        placeholder="Private notes…"
        rows={2}
        aria-label={`Notes for ${name}`}
        className="mt-2 resize-y"
      />
      {noteState === 'saving' && <small className="text-neutral-400">Saving…</small>}
      {noteState === 'saved' && <small className="text-green-700">Saved</small>}
    </div>
  );
}

function matchTone(score: number): 'success' | 'warn' | 'neutral' {
  const pct = Math.round(score * 100);
  return pct >= 70 ? 'success' : pct >= 50 ? 'warn' : 'neutral';
}
