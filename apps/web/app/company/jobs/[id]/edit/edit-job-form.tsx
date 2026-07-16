'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateJob } from '@/app/actions/post-job';
import { JobFormFields } from '@/app/company/jobs/job-form-fields';
import { PostJobFormSchema, type PostJobFormValues } from '@/app/company/jobs/job-form-schema';
import { Button } from '@/app/components/ui/button';

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
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
      <JobFormFields register={register} errors={errors} />

      {error && <p className="m-0 text-red-700">{error}</p>}
      {saved && <p className="m-0 text-green-700">Saved.</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
