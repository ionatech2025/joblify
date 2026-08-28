'use client';

import { useState, useTransition } from 'react';
import { shareJobWithJobseeker } from '@/app/actions/share-job';
import { Button } from '@/app/components/ui/button';
import { Select } from '@/app/components/ui/form';
import { toast } from '@/lib/stores/ui';
import { unwrap } from '@/lib/action-result';

export function ShareJobForm({
  jobSeekerUserId,
  publishedJobs,
}: {
  jobSeekerUserId: string;
  publishedJobs: { id: string; title: string }[];
}) {
  const [jobPostId, setJobPostId] = useState('');
  const [isPending, startTransition] = useTransition();

  function onShare() {
    if (!jobPostId) return;
    startTransition(async () => {
      try {
        unwrap(await shareJobWithJobseeker(jobPostId, jobSeekerUserId));
        toast.success('Job shared');
        setJobPostId('');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        toast.error("Couldn't share the job", message);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={jobPostId}
        onChange={(e) => setJobPostId(e.target.value)}
        disabled={isPending}
        className="w-48"
        aria-label="Choose a job to share"
      >
        <option value="" disabled>
          Share a job…
        </option>
        {publishedJobs.map((j) => (
          <option key={j.id} value={j.id}>
            {j.title}
          </option>
        ))}
      </Select>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onShare}
        disabled={isPending || !jobPostId}
      >
        Share
      </Button>
    </div>
  );
}
