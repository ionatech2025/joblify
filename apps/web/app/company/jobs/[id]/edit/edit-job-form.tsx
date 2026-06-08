'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateJob } from '@/app/actions/post-job';
import { JobFormFields, PostJobFormSchema, type PostJobFormValues } from '@/app/company/jobs/job-form-fields';

export function EditJobForm({ jobId, initial }: { jobId: string; initial: PostJobFormValues }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostJobFormValues>({
    resolver: zodResolver(PostJobFormSchema),
    defaultValues: initial,
  });

  function onSubmit(values: PostJobFormValues) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateJob(jobId, values);
        setSaved(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save changes.');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}
    >
      <JobFormFields register={register} errors={errors} />

      {error && <p style={{ color: '#a00', margin: 0 }}>{error}</p>}
      {saved && <p style={{ color: '#137333', margin: 0 }}>Saved.</p>}

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: '0.75rem 1.25rem',
          background: '#111',
          color: 'white',
          borderRadius: 8,
          border: 0,
          fontWeight: 600,
          cursor: isPending ? 'wait' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {isPending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
