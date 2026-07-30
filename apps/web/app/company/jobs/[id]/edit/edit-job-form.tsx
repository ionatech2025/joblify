'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateJob, archiveJob } from '@/app/actions/post-job';
import { JobFormFields } from '@/app/company/jobs/job-form-fields';
import { PostJobFormSchema, type PostJobFormValues } from '@/app/company/jobs/job-form-schema';
import { Button } from '@/app/components/ui/button';

export function EditJobForm({ jobId, initial }: { jobId: string; initial: PostJobFormValues }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onDelete() {
    if (
      !window.confirm(
        'Delete this job post? Existing applications and chat history are kept, but the listing is removed from search and your active posts.',
      )
    ) {
      return;
    }
    setError(null);
    startDelete(async () => {
      try {
        await archiveJob(jobId);
        router.push('/company/jobs');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete job post.');
      }
    });
  }

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

      {error && <p className="m-0 text-danger">{error}</p>}
      {saved && <p className="m-0 text-success">Saved.</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={isDeleting}
          onClick={onDelete}
          className="self-start"
        >
          {isDeleting ? 'Deleting…' : 'Delete job post'}
        </Button>
      </div>
    </form>
  );
}
