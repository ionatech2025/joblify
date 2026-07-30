import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { EditJobForm } from './edit-job-form';
import type { PostJobFormValues } from '@/app/company/jobs/job-form-schema';
import { JOB_STATUS_LABEL } from '@/app/company/jobs/job-status';
import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'Edit job' };

export default async function EditJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ just_posted?: string }>;
}) {
  const user = await requireRole('COMPANY');
  const { id } = await params;
  const sp = await searchParams;

  const job = await db.jobPost.findFirst({
    where: { id, companyId: user.id, deletedAt: null },
    include: { chatArea: { select: { id: true } } },
  });
  if (!job) notFound();

  const initial: PostJobFormValues = {
    title: job.title,
    description: job.description,
    requirements: job.requirements ?? '',
    industry: job.industry,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    workMode: job.workMode,
    location: job.location ?? '',
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    applicationDeadline: job.applicationDeadline
      ? job.applicationDeadline.toISOString().slice(0, 10)
      : '',
    publish: job.status === 'PUBLISHED',
    createChatArea: !!job.chatArea,
  };

  return (
    <main>
      <PageHeader
        title="Edit job"
        width="max-w-3xl"
        actions={
          job.status === 'PUBLISHED' ? (
            <Link
              href={`/jobs/${job.slug}`}
              className="inline-flex items-center gap-1 text-brand underline"
            >
              View public page
              <ExternalLink aria-hidden className="size-3.5" />
            </Link>
          ) : undefined
        }
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {sp.just_posted && (
          <div className="my-4 rounded-card bg-success-subtle px-4 py-3 text-sm text-success">
            Job posted — it&apos;s live on /jobs and indexed within a minute.
          </div>
        )}

        <p className="mt-2 text-fg-muted">
          Current status: <strong>{JOB_STATUS_LABEL[job.status]}</strong>. Saving re-extracts skills
          and re-indexes search.
        </p>

        <EditJobForm jobId={job.id} initial={initial} />
      </div>
    </main>
  );
}
