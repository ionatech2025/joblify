'use client';

import { useId, useState, useTransition } from 'react';
import { Flag } from 'lucide-react';
import { reportJob } from '@/app/actions/report-job';
import { unwrap } from '@/lib/action-result';
import { Button } from '@/app/components/ui/button';
import { Select, Textarea } from '@/app/components/ui/form';
import { toast } from '@/lib/stores/ui';

const REASONS = [
  { value: 'SCAM', label: 'Looks like a scam (asks for money, off-platform “interview”)' },
  { value: 'DISCRIMINATORY', label: 'Discriminatory' },
  { value: 'MISLEADING', label: 'Misleading (pay, role or company)' },
  { value: 'DUPLICATE', label: 'Duplicate posting' },
  { value: 'OTHER', label: 'Something else' },
] as const;

/**
 * "Report this job". Deliberately quiet — a disclosure under the posting, not a
 * prominent control — and available to any signed-in user; the action handles
 * sign-in, de-duplication and rate limiting.
 */
export function ReportJob({ jobPostId }: { jobPostId: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]['value']>('SCAM');
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        unwrap(await reportJob({ jobPostId, reason, details: details || undefined }));
        setSent(true);
        toast.success('Report sent', 'A moderator will review this posting.');
      } catch (err) {
        toast.error("Couldn't send the report", err instanceof Error ? err.message : 'Try again.');
      }
    });
  }

  if (sent) {
    return <p className="text-fg-muted m-0 text-sm">Thanks — we’ll review this posting.</p>;
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-form`}
        onClick={() => setOpen((v) => !v)}
        className="text-fg-muted hover:text-fg inline-flex items-center gap-1 text-sm underline-offset-2 hover:underline"
      >
        <Flag aria-hidden className="size-3.5" />
        Report this job
      </button>
      {open && (
        <form id={`${id}-form`} onSubmit={submit} className="mt-3 flex max-w-lg flex-col gap-2">
          <label htmlFor={`${id}-reason`} className="text-fg text-sm font-medium">
            What is wrong with it?
          </label>
          <Select
            id={`${id}-reason`}
            value={reason}
            onChange={(e) => setReason(e.target.value as typeof reason)}
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          <label htmlFor={`${id}-details`} className="text-fg text-sm font-medium">
            Details <span className="text-fg-muted font-normal">(optional)</span>
          </label>
          <Textarea
            id={`${id}-details`}
            value={details}
            maxLength={1000}
            rows={3}
            onChange={(e) => setDetails(e.target.value)}
          />
          <div>
            <Button type="submit" size="sm" loading={pending}>
              {pending ? 'Sending…' : 'Send report'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
