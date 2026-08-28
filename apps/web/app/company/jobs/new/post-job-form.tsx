'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { postJob } from '@/app/actions/post-job';
import { JobFormFields } from '@/app/company/jobs/job-form-fields';
import { PostJobFormSchema, type PostJobFormValues } from '@/app/company/jobs/job-form-schema';
import { FormSheet } from '@/app/components/console/sheet';
import { DirtyBar } from '@/app/components/console/dirty-bar';
import { usePostJobDraftStore } from '@/lib/stores/post-job-draft';
import { useFormDraft } from '@/lib/use-form-draft';
import { toast } from '@/lib/stores/ui';
import { unwrap } from '@/lib/action-result';

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
  const clearDraft = usePostJobDraftStore((s) => s.clear);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PostJobFormValues>({
    resolver: zodResolver(PostJobFormSchema),
    defaultValues: initialValues,
  });

  // Restore on mount, then persist on a debounce. See lib/use-form-draft.ts.
  useFormDraft({
    store: usePostJobDraftStore,
    watch,
    reset,
    initial: initialValues as PostJobFormValues,
    onRestore: () => setRestoredDraft(true),
  });

  // `publish` has no input of its own any more — the statusbar is its control —
  // so it is driven through setValue against RHF's value store, which is
  // seeded from defaultValues above. Read with useWatch rather than watch():
  // watch() returns a fresh function React Compiler cannot memoize, which was
  // bailing the whole component out of compilation.
  const publish = useWatch({ control, name: 'publish' }) ?? true;

  function onSubmit(values: PostJobFormValues) {
    setError(null);
    startTransition(async () => {
      try {
        const id = unwrap(await postJob(values));
        clearDraft();
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
    clearDraft();
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
