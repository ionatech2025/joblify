import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { EditJobForm } from './edit-job-form';
import type { PostJobFormValues } from '@/app/company/jobs/job-form-fields';

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
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Edit job</h1>
        {job.status === 'PUBLISHED' && (
          <Link href={`/jobs/${job.slug}`} style={{ color: '#1856a8' }}>
            View public page ↗
          </Link>
        )}
      </div>

      {sp.just_posted && (
        <div style={{ padding: '0.75rem 1rem', background: '#e7f6ec', borderRadius: 8, margin: '1rem 0' }}>
          Job posted — it&apos;s live on /jobs and indexed within a minute.
        </div>
      )}

      <p style={{ color: '#666' }}>
        Current status: <strong>{job.status}</strong>. Saving re-extracts skills and re-indexes search.
      </p>

      <EditJobForm jobId={job.id} initial={initial} />
    </main>
  );
}
