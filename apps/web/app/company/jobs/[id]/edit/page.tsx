import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { EditJobForm } from './edit-job-form';
import type { PostJobFormValues } from '@/app/company/jobs/job-form-fields';
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
    applicationDeadline: job.applicationDeadline ? job.applicationDeadline.toISOString().slice(0, 10) : '',
    publish: job.status === 'PUBLISHED',
  };

  return (
    <main>
      <PageHeader
        title="Edit job"
        width="max-w-3xl"
        actions={
          job.status === 'PUBLISHED' ? (
            <Link href={`/jobs/${job.slug}`} className="text-indigo-700 hover:underline">
              View public page ↗
            </Link>
          ) : undefined
        }
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {sp.just_posted && (
        <div className="my-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Job posted — it&apos;s live on /jobs and indexed within a minute.
        </div>
      )}

      <p className="mt-2 text-neutral-600">
        Current status: <strong>{job.status}</strong>. Saving re-extracts skills and re-indexes search.
      </p>

      <EditJobForm jobId={job.id} initial={initial} />
      </div>
    </main>
  );
}
