'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { postJob } from '@/app/actions/post-job';
import { JobFormFields } from '@/app/company/jobs/job-form-fields';
import { PostJobFormSchema, type PostJobFormValues } from '@/app/company/jobs/job-form-schema';
import { Button } from '@/app/components/ui/button';
import { toast } from '@/lib/stores/ui';

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
