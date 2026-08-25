'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { postJob } from '@/app/actions/post-job';
import { JobFormFields } from '@/app/company/jobs/job-form-fields';
import { PostJobFormSchema, type PostJobFormValues } from '@/app/company/jobs/job-form-schema';
import { FormSheet } from '@/app/components/console/sheet';
import { DirtyBar } from '@/app/components/console/dirty-bar';
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
  // A restored draft is unsaved work, but reset() rebases RHF's dirty baseline
  // and would report the form as clean. Tracked separately so the dirty bar
  // tells the truth after a reload.
  const [restoredDraft, setRestoredDraft] = useState(false);
  const draftStore = usePostJobDraftStore();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PostJobFormValues>({
    resolver: zodResolver(PostJobFormSchema),
    defaultValues: initialValues,
  });

  // Restore a saved draft once on mount (draft wins over defaults for any
  // field it has a value for). An empty draft shouldn't touch the form.
  useEffect(() => {
    if (Object.keys(draftStore.draft).length > 0) {
      reset({ ...initialValues, ...draftStore.draft });
      setRestoredDraft(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change so accidental navigation doesn't lose the draft.
  useEffect(() => {
    const sub = watch((values) => draftStore.update(values));
    return () => sub.unsubscribe();
  }, [watch, draftStore]);

  // `publish` has no input of its own any more — the statusbar is its control —
  // so it is driven through setValue/watch against RHF's value store, which is
  // seeded from defaultValues above.
  const publish = watch('publish') ?? true;

  function onSubmit(values: PostJobFormValues) {
    setError(null);
    startTransition(async () => {
      try {
        const id = await postJob(values);
        draftStore.clear();
        setRestoredDraft(false);
        toast.success('Job posted');
        router.push(`/company/jobs/${id}/edit?just_posted=1`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to post job.';
        setError(message);
        toast.error("Couldn't post job", message);
      }
    });
  }

  function onDiscard() {
    if (!window.confirm('Discard this draft? The fields will be emptied.')) return;
    draftStore.clear();
    reset(initialValues as PostJobFormValues);
    setRestoredDraft(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSheet>
        <JobFormFields
          register={register}
          errors={errors}
          publish={publish}
          onPublishChange={(next) => setValue('publish', next, { shouldDirty: true })}
        />

        {error && (
          <p role="alert" className="text-danger mt-4 text-[13px]">
            {error}
          </p>
        )}

        <DirtyBar
          dirty={isDirty || restoredDraft}
          saving={isPending}
          onDiscard={onDiscard}
          saveLabel={publish ? 'Post job' : 'Save as draft'}
          savingLabel="Saving…"
        />
      </FormSheet>
    </form>
  );
}
