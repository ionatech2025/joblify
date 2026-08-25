'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { JobPostStatus } from '@prisma/client';
import { Trash2 } from 'lucide-react';
import { updateJob, archiveJob } from '@/app/actions/post-job';
import { JobFormFields } from '@/app/company/jobs/job-form-fields';
import { PostJobFormSchema, type PostJobFormValues } from '@/app/company/jobs/job-form-schema';
import { FormSheet } from '@/app/components/console/sheet';
import { DirtyBar } from '@/app/components/console/dirty-bar';
import { toast } from '@/lib/stores/ui';

export function EditJobForm({
  jobId,
  initial,
  status,
}: {
  jobId: string;
  initial: PostJobFormValues;
  status: JobPostStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PostJobFormValues>({
    resolver: zodResolver(PostJobFormSchema),
    defaultValues: initial,
  });

  const publish = watch('publish') ?? false;

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
        toast.success('Job post deleted');
        router.push('/company/jobs');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete job post.';
        setError(message);
        toast.error("Couldn't delete job post", message);
      }
    });
  }

  function onSubmit(values: PostJobFormValues) {
    setError(null);
    startTransition(async () => {
      try {
        await updateJob(jobId, values);
        // Rebase the dirty baseline onto what was just saved, so the bar flips
        // back to "All changes saved" instead of staying dirty forever.
        reset(values);
        router.refresh();
        toast.success('Job post updated');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save changes.';
        setError(message);
        toast.error("Couldn't save changes", message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSheet>
        <JobFormFields
          register={register}
          errors={errors}
          publish={publish}
          onPublishChange={(next) => setValue('publish', next, { shouldDirty: true })}
          status={status}
        />

        {error && (
          <p role="alert" className="text-danger mt-4 text-[13px]">
            {error}
          </p>
        )}

        <DirtyBar
          dirty={isDirty}
          saving={isPending}
          onDiscard={() => reset(initial)}
          saveLabel="Save changes"
        >
          <button
            type="button"
            disabled={isDeleting}
            onClick={onDelete}
            className="border-danger/30 text-danger hover:bg-danger-subtle focus-visible:ring-danger rounded-control inline-flex items-center gap-1.5 border px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          >
            <Trash2 aria-hidden className="size-3.5" />
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </DirtyBar>
      </FormSheet>
    </form>
  );
}
