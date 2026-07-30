'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Resume } from '@prisma/client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useApplyDraftStore } from '@/lib/stores/apply-draft';
import { submitApplication } from '@/app/actions/apply';
import { Field, Select, Textarea } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';

export function ApplyForm({
  jobId,
  jobSlug,
  resumes,
}: {
  jobId: string;
  jobSlug: string;
  resumes: Resume[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Use the store's stable getter (returns the shared `blank` ref when empty).
  // An inline `?? {…}` here returns a NEW object every render → Zustand's
  // snapshot never matches → infinite re-render (React #185).
  const draft = useApplyDraftStore((s) => s.get(jobId));
  const update = useApplyDraftStore((s) => s.update);
  const clear = useApplyDraftStore((s) => s.clear);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await submitApplication(formData);
        clear(jobId);
        router.push('/jobseeker/applications?just_applied=1');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit. Try again.');
      }
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="jobSlug" value={jobSlug} />

      <Field label="Resume">
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
            name="resumeId"
            required
            value={draft.resumeId ?? ''}
            onChange={(e) => update(jobId, { resumeId: e.target.value || null })}
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

      <Field label="Cover letter (optional)">
        <Textarea
          name="coverLetter"
          rows={8}
          value={draft.coverLetter}
          onChange={(e) => update(jobId, { coverLetter: e.target.value })}
          maxLength={5000}
          placeholder="Tell the team why you'd be a great fit."
        />
      </Field>

      <label className="flex items-start gap-2 text-sm text-fg-muted">
        <input
          type="checkbox"
          name="acknowledgedDataUse"
          required
          checked={draft.acknowledgedDataUse}
          onChange={(e) => update(jobId, { acknowledgedDataUse: e.target.checked })}
          className="mt-1"
        />
        <span>
          I agree my application data (resume, cover letter, profile) may be shared with this
          employer.
        </span>
      </label>

      {error && <p className="m-0 text-danger">{error}</p>}

      <Button type="submit" disabled={isPending || resumes.length === 0} className="self-start">
        {isPending ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  );
}
