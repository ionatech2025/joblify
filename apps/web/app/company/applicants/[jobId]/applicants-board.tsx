'use client';

import { useState, useTransition } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Users } from 'lucide-react';
import type { ApplicationStatus } from '@prisma/client';
import { updateApplicantStatus, saveApplicantNote } from '@/app/actions/update-applicant-status';
import { Badge } from '@/app/components/ui/badge';
import { EmptyState } from '@/app/components/ui/empty-state';
import { Textarea } from '@/app/components/ui/form';
import { KanbanBoard, KanbanCard, KanbanColumn } from '@/app/components/console/kanban';
import {
  APPLICATION_STAGES as STAGES,
  CLOSED_APPLICATION_STATUSES as CLOSED,
  applicationStatusLabel,
  matchTone,
} from '@/lib/ui/status';
import { toast } from '@/lib/stores/ui';
import { cn } from '@/lib/cn';
import { TimeStamp } from '@/app/components/ui/timestamp';

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

/**
 * Applicant pipeline.
 *
 * Two changes from the previous board, both about where control lives:
 *
 *  - Sort and the closed-stage toggle moved to the control panel. They were
 *    URL state rendered as form controls *inside* the board, which is why this
 *    component used to need `useSearchParams()` at all; the page now reads them
 *    and hands them down, and the rows arrive already ordered by the database.
 *  - Advancing a candidate is one click. It was a `<select>` of all eight
 *    statuses in every card — open, scan, pick the adjacent one — to express
 *    "move forward by one".
 */
export function ApplicantsBoard({
  applications,
  showClosed,
}: {
  applications: Row[];
  showClosed: boolean;
}) {
  const [rows, setRows] = useState(applications);
  const [, startTransition] = useTransition();

  function changeStatus(id: string, status: ApplicationStatus) {
    const prev = rows;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    startTransition(async () => {
      try {
        await updateApplicantStatus(id, status);
        // A status change emails the applicant and sends an in-app
        // notification, so confirming it actually committed matters here more
        // than anywhere else on the board.
        toast.success(
          `Moved to ${applicationStatusLabel(status)}`,
          'The applicant has been notified.',
        );
      } catch (err) {
        setRows(prev);
        const message = err instanceof Error ? err.message : 'Status change failed.';
        toast.error("Couldn't change the status", message);
      }
    });
  }

  if (rows.length === 0)
    return (
      <EmptyState
        icon={<Users />}
        title="No applicants yet"
        description="Applicants show up here the moment they apply, ranked by how well their resume matches this role."
      />
    );

  const stages = showClosed ? STAGES : STAGES.filter((s) => !CLOSED.includes(s.status));

  return (
    <KanbanBoard>
      {stages.map((stage) => {
        const items = rows.filter((r) => r.status === stage.status);
        const scored = items.filter((r) => r.matchScore !== null);
        const avg =
          scored.length > 0
            ? Math.round(
                (scored.reduce((n, r) => n + (r.matchScore ?? 0), 0) / scored.length) * 100,
              )
            : null;

        return (
          <KanbanColumn
            key={stage.status}
            title={stage.label}
            count={items.length}
            aggregate={avg === null ? undefined : `Avg match ${avg}%`}
            // Splitting the column by match strength turns "9 shortlisted" into
            // "9 shortlisted, and here's whether they're any good".
            segments={[
              {
                tone: 'success',
                label: 'strong match',
                count: scored.filter((r) => matchTone(r.matchScore ?? 0) === 'success').length,
              },
              {
                tone: 'warn',
                label: 'partial match',
                count: scored.filter((r) => matchTone(r.matchScore ?? 0) === 'warn').length,
              },
              {
                tone: 'neutral',
                label: 'low match',
                count: scored.filter((r) => matchTone(r.matchScore ?? 0) === 'neutral').length,
              },
            ]}
          >
            {items.map((r) => (
              <ApplicantCard key={r.id} row={r} onStatus={changeStatus} />
            ))}
          </KanbanColumn>
        );
      })}
    </KanbanBoard>
  );
}

function ApplicantCard({
  row,
  onStatus,
}: {
  row: Row;
  onStatus: (id: string, s: ApplicationStatus) => void;
}) {
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
    } catch (err) {
      setNoteState('idle');
      const message = err instanceof Error ? err.message : 'Note failed to save.';
      toast.error("Couldn't save note", message);
    }
  }

  const name =
    `${row.seeker.firstName ?? ''} ${row.seeker.lastName ?? ''}`.trim() || row.seeker.email;

  return (
    <KanbanCard>
      <div className="flex items-baseline justify-between gap-2">
        <strong className="text-fg min-w-0 truncate text-[13px]" title={name}>
          {name}
        </strong>
        {row.matchScore !== null && (
          <Badge tone={matchTone(row.matchScore)} className="shrink-0">
            {Math.round(row.matchScore * 100)}%
          </Badge>
        )}
      </div>
      {row.seeker.headline && (
        <p className="text-fg-subtle mt-0.5 truncate text-[11px]" title={row.seeker.headline}>
          {row.seeker.headline}
        </p>
      )}
      <p className="text-fg-subtle mt-0.5 text-[11px]">
        Applied <TimeStamp value={row.appliedAt} />
      </p>

      <div className="mt-1 flex gap-3 text-[11px]">
        <a
          href={row.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand inline-flex items-center gap-1 underline"
        >
          Résumé
          <ExternalLink aria-hidden className="size-3" />
        </a>
        {row.coverLetter && (
          <button onClick={() => setOpenCover((o) => !o)} className="text-brand underline">
            {openCover ? 'Hide cover letter' : 'Cover letter'}
          </button>
        )}
      </div>

      {openCover && row.coverLetter && (
        <p className="rounded-control border-border bg-surface-sunken text-fg-muted mt-1 border p-1.5 text-[11px] whitespace-pre-wrap">
          {row.coverLetter}
        </p>
      )}

      <StageStepper
        current={row.status}
        name={name}
        onSelect={(status) => onStatus(row.id, status)}
      />

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
        className="mt-1.5 resize-y px-2 py-1 text-[12px]"
      />
      <span aria-live="polite" className="text-[11px]">
        {noteState === 'saving' && <span className="text-fg-subtle">Saving…</span>}
        {noteState === 'saved' && <span className="text-success">Saved</span>}
      </span>
    </KanbanCard>
  );
}

/**
 * Stage control for one card: back / forward by one, plus a dropdown to jump
 * anywhere in the pipeline. The arrows cover the overwhelmingly common action
 * in a single click; the dropdown covers rejecting, or skipping a stage.
 *
 * Rejection is the only transition that gates on a confirm — it emails the
 * applicant and there is no undo. Every other move is freely reversible, which
 * is exactly why the back arrow exists.
 */
function StageStepper({
  current,
  name,
  onSelect,
}: {
  current: ApplicationStatus;
  name: string;
  onSelect: (status: ApplicationStatus) => void;
}) {
  const index = STAGES.findIndex((s) => s.status === current);
  const label = applicationStatusLabel(current);

  function pick(status: ApplicationStatus) {
    if (status === current) return;
    if (
      status === 'REJECTED' &&
      !window.confirm(`Reject ${name}? They'll be emailed, and this can't be undone.`)
    ) {
      return;
    }
    onSelect(status);
  }

  const step = (delta: number) => {
    const next = STAGES[index + delta];
    return next && !CLOSED.includes(next.status) ? next.status : undefined;
  };
  const back = step(-1);
  const forward = step(1);

  const arrow =
    'grid size-6 shrink-0 place-items-center border border-border text-fg-muted transition-colors enabled:hover:bg-surface-sunken enabled:hover:text-fg disabled:opacity-35';

  return (
    <div className="mt-2 flex items-stretch gap-1">
      <button
        type="button"
        disabled={!back}
        onClick={() => back && pick(back)}
        aria-label={
          back ? `Move ${name} back to ${applicationStatusLabel(back)}` : 'No earlier stage'
        }
        className={cn(arrow, 'rounded-control')}
      >
        <ChevronLeft aria-hidden className="size-3.5" />
      </button>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="border-border text-fg hover:bg-surface-sunken focus-visible:ring-brand rounded-control inline-flex min-w-0 flex-1 items-center justify-between gap-1 border px-2 py-0.5 text-[12px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none">
          <span className="truncate">{label}</span>
          <ChevronDown aria-hidden className="size-3 shrink-0 opacity-60" />
          <span className="sr-only">Change stage for {name}</span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={4}
            align="start"
            className="o-console border-border bg-surface shadow-o-overlay rounded-card z-50 min-w-[11rem] border p-1"
          >
            {STAGES.map((s) => (
              <DropdownMenu.Item
                key={s.status}
                onSelect={() => pick(s.status)}
                className={cn(
                  'rounded-control data-highlighted:bg-surface-sunken cursor-pointer px-2 py-1 text-[12px] outline-none',
                  s.status === current ? 'text-fg font-semibold' : 'text-fg-muted',
                  s.status === 'REJECTED' && 'text-danger',
                )}
              >
                {s.label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <button
        type="button"
        disabled={!forward}
        onClick={() => forward && pick(forward)}
        aria-label={
          forward ? `Advance ${name} to ${applicationStatusLabel(forward)}` : 'No later stage'
        }
        className={cn(arrow, 'rounded-control')}
      >
        <ChevronRight aria-hidden className="size-3.5" />
      </button>
    </div>
  );
}
