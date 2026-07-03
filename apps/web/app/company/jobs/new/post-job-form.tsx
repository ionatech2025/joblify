'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { postJob } from '@/app/actions/post-job';
import { JobFormFields, PostJobFormSchema, type PostJobFormValues } from '@/app/company/jobs/job-form-fields';
import { Button } from '@/app/components/ui/button';

export function PostJobForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostJobFormValues>({
    resolver: zodResolver(PostJobFormSchema),
    defaultValues: {
      industry: 'TECHNOLOGY',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      workMode: 'ONSITE',
      salaryCurrency: 'USD',
      salaryMin: null,
      salaryMax: null,
      publish: true,
      createChatArea: false,
    },
  });

  function onSubmit(values: PostJobFormValues) {
    setError(null);
    startTransition(async () => {
      try {
        const id = await postJob(values);
        router.push(`/company/jobs/${id}/edit?just_posted=1`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to post job.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
      <JobFormFields register={register} errors={errors} />

      {error && <p className="m-0 text-red-700">{error}</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? 'Saving…' : 'Post job'}
      </Button>
    </form>
  );
}
