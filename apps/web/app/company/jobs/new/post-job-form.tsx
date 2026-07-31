'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { postJob } from '@/app/actions/post-job';
import { JobFormFields } from '@/app/company/jobs/job-form-fields';
import { PostJobFormSchema, type PostJobFormValues } from '@/app/company/jobs/job-form-schema';
import { Button } from '@/app/components/ui/button';
import { usePostJobDraftStore } from '@/lib/stores/post-job-draft';
import { toast } from '@/lib/stores/ui';

const initialValues: Partial<PostJobFormValues> = {
  industry: 'TECHNOLOGY',
  jobType: 'FULL_TIME',
  experienceLevel: 'MID',
  workMode: 'ONSITE',
  salaryCurrency: 'USD',
  salaryMin: null,
  salaryMax: null,
  publish: true,
  createChatArea: false,
};

export function PostJobForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const draftStore = usePostJobDraftStore();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PostJobFormValues>({
    resolver: zodResolver(PostJobFormSchema),
    defaultValues: initialValues,
  });

  // Restore a saved draft once on mount (draft wins over defaults for any
  // field it has a value for). An empty draft shouldn't touch the form.
  useEffect(() => {
    if (Object.keys(draftStore.draft).length > 0) {
      reset({ ...initialValues, ...draftStore.draft });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change so accidental navigation doesn't lose the draft.
  useEffect(() => {
    const sub = watch((values) => draftStore.update(values));
    return () => sub.unsubscribe();
  }, [watch, draftStore]);

  function onSubmit(values: PostJobFormValues) {
    setError(null);
    startTransition(async () => {
      try {
        const id = await postJob(values);
        draftStore.clear();
        toast.success('Job posted');
        router.push(`/company/jobs/${id}/edit?just_posted=1`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to post job.';
        setError(message);
        toast.error("Couldn't post job", message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
      <JobFormFields register={register} errors={errors} />

      {error && <p className="m-0 text-danger">{error}</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? 'Saving…' : 'Post job'}
      </Button>
    </form>
  );
}
