'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useApplyDraftStore } from '@/lib/stores/apply-draft';
import { submitApplication } from '@/app/actions/apply';
import { Field, Select, Textarea } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';
import { unwrap } from '@/lib/action-result';

export function ApplyForm({
  jobId,
  jobSlug,
  resumes,
}: {
  jobId: string;
  jobSlug: string;
  /** id + title only — see the query in page.tsx. */
  resumes: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Field-level problems, found before anything is sent. They live here rather
  // than in the browser's `required` bubble (see noValidate below): an inline,
  // persistent message that is announced and tied to its control.
  const [fieldErrors, setFieldErrors] = useState<{ resume?: string; consent?: string }>({});
  const resumeRef = useRef<HTMLSelectElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  // Use the store's stable getter (returns the shared `blank` ref when empty).
  // An inline `?? {…}` here returns a NEW object every render → Zustand's
  // snapshot never matches → infinite re-render (React #185).
  const draft = useApplyDraftStore((s) => s.get(jobId));
  const update = useApplyDraftStore((s) => s.update);
  const clear = useApplyDraftStore((s) => s.clear);

  // Characters left are only worth saying out loud near the limit; announcing
  // every keystroke of a long letter would be noise.
  const COVER_LETTER_MAX = 5000;
  const remaining = COVER_LETTER_MAX - draft.coverLetter.length;

  function onSubmit(formData: FormData) {
    setError(null);

    const next: { resume?: string; consent?: string } = {};
    if (!formData.get('resumeId')) next.resume = 'Choose the resume to apply with.';
    if (!formData.get('acknowledgedDataUse')) {
      next.consent = 'Please confirm you agree before submitting.';
    }
    setFieldErrors(next);
    if (next.resume || next.consent) {
      // Same behaviour as the console forms: the first problem takes focus.
      (next.resume ? resumeRef.current : consentRef.current)?.focus();
      return;
    }

    startTransition(async () => {
      try {
        unwrap(await submitApplication(formData));
        clear(jobId);
        router.push('/jobseeker/applications?just_applied=1');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit. Try again.');
      }
    });
  }

  return (
    // noValidate: the checks are done in onSubmit with inline messages. The
    // native `required` bubble is unstyled, disappears on its own and is not an
    // inline error a screen reader can find again.
    <form action={onSubmit} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="jobSlug" value={jobSlug} />

      <Field label="Resume" required error={fieldErrors.resume}>
        {resumes.length === 0 ? (
          <p className="m-0 text-danger">
            You need a resume first.{' '}
            <Link
              href="/jobseeker/resumes"
              className="inline-flex items-center gap-1 font-semibold text-brand underline"
            >
              Upload one
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </p>
        ) : (
          <Select
            ref={resumeRef}
            name="resumeId"
            required
            value={draft.resumeId ?? ''}
            onChange={(e) => {
              update(jobId, { resumeId: e.target.value || null });
              if (fieldErrors.resume) setFieldErrors((f) => ({ ...f, resume: undefined }));
            }}
          >
            <option value="" disabled>
              Choose a resume…
            </option>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        label="Cover letter (optional)"
        hint={
          remaining <= 500
            ? `${remaining.toLocaleString('en-US')} of ${COVER_LETTER_MAX.toLocaleString('en-US')} characters left`
            : `Up to ${COVER_LETTER_MAX.toLocaleString('en-US')} characters`
        }
      >
        <Textarea
          name="coverLetter"
          rows={8}
          value={draft.coverLetter}
          onChange={(e) => update(jobId, { coverLetter: e.target.value })}
          maxLength={COVER_LETTER_MAX}
          placeholder="Tell the team why you'd be a great fit."
        />
      </Field>

      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-2 text-sm text-fg-muted">
          <input
            ref={consentRef}
            type="checkbox"
            name="acknowledgedDataUse"
            required
            aria-required
            aria-invalid={fieldErrors.consent ? true : undefined}
            aria-describedby={fieldErrors.consent ? 'consent-error' : undefined}
            checked={draft.acknowledgedDataUse}
            onChange={(e) => {
              update(jobId, { acknowledgedDataUse: e.target.checked });
              if (fieldErrors.consent) setFieldErrors((f) => ({ ...f, consent: undefined }));
            }}
            className="mt-1"
          />
          <span>
            I agree my application data (resume, cover letter, profile) may be shared with this
            employer, and I understand a similarity score is computed from my resume and shown to
            the employer and to me.{' '}
            <a href="/legal/ai" className="underline" target="_blank" rel="noopener noreferrer">
              How this works<span className="sr-only"> (opens in a new tab)</span>
            </a>
            . No application is decided automatically.
          </span>
        </label>
        {fieldErrors.consent ? (
          <span id="consent-error" role="alert" className="text-danger text-sm">
            {fieldErrors.consent}
          </span>
        ) : null}
      </div>

      {error && (
        <p role="alert" className="m-0 text-danger">
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={isPending}
        disabled={resumes.length === 0 ? true : undefined}
        className="self-start"
      >
        {isPending ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  );
}
