'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Resume } from '@prisma/client';
import Link from 'next/link';
import { useApplyDraftStore } from '@/lib/stores/apply-draft';
import { submitApplication } from '@/app/actions/apply';

// Form scaffold — the Server Action `submitApplication` lands in Week 5,
// alongside the Blob signed-upload flow for a fresh resume.

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
  const draft = useApplyDraftStore((s) => s.byJob[jobId] ?? { resumeId: null, coverLetter: '', acknowledgedDataUse: false });
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
    <form action={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="jobSlug" value={jobSlug} />

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span>Resume</span>
        {resumes.length === 0 ? (
          <p style={{ color: '#a00', margin: 0 }}>
            You need a resume first.{' '}
            <Link href="/jobseeker/resumes" style={{ color: '#1856a8', fontWeight: 600 }}>
              Upload one →
            </Link>
          </p>
        ) : (
          <select
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
          </select>
        )}
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span>Cover letter (optional)</span>
        <textarea
          name="coverLetter"
          rows={8}
          value={draft.coverLetter}
          onChange={(e) => update(jobId, { coverLetter: e.target.value })}
          maxLength={5000}
          placeholder="Tell the team why you'd be a great fit."
        />
      </label>

      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <input
          type="checkbox"
          name="acknowledgedDataUse"
          required
          checked={draft.acknowledgedDataUse}
          onChange={(e) => update(jobId, { acknowledgedDataUse: e.target.checked })}
        />
        <span style={{ fontSize: '0.9rem', color: '#555' }}>
          I agree my application data (resume, cover letter, profile) may be shared with this employer.
        </span>
      </label>

      {error && <p style={{ color: '#a00', margin: 0 }}>{error}</p>}

      <button
        type="submit"
        disabled={isPending || resumes.length === 0}
        style={{
          padding: '0.75rem 1.25rem',
          background: '#111',
          color: 'white',
          borderRadius: 8,
          border: 0,
          fontWeight: 600,
          cursor: isPending ? 'wait' : 'pointer',
        }}
      >
        {isPending ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  );
}
