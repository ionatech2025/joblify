import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ApplyForm } from './apply-form';
import { PageHeader } from '@/app/components/ui/ambient';
import ApplyLoading from './loading';

type Params = Promise<{ slug: string }>;

export const metadata = { title: 'Apply' };

export default async function ApplyPage({ params }: { params: Params }) {
  const { slug } = await params;
  // The body is fully dynamic (auth + per-user resume list), so it streams
  // inside a Suspense boundary as cacheComponents requires. The outer
  // route-segment loading.tsx resolves almost instantly (its own suspend
  // point is just `await params`), so without a real fallback here the
  // actual latency window (auth + 3 queries) rendered a blank page before
  // the form popped in — reuse the same skeleton loading.tsx already shows,
  // same fix as job-detail-skeleton.tsx one route up.
  return (
    <Suspense fallback={<ApplyLoading />}>
      <ApplyContent slug={slug} />
    </Suspense>
  );
}

async function ApplyContent({ slug }: { slug: string }) {
  const user = await requireRole('JOB_SEEKER');

  const job = await db.jobPost.findUnique({
    where: { slug },
    include: { company: { include: { companyProfile: true } } },
  });
  if (!job || job.deletedAt || job.status !== 'PUBLISHED') notFound();

  const existing = await db.jobApplication.findUnique({
    where: { jobPostId_jobSeekerId: { jobPostId: job.id, jobSeekerId: user.id } },
    select: { id: true },
  });
  if (existing) redirect(`/jobseeker/applications`);

  const resumes = await db.resume.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main>
      <PageHeader
        eyebrow="Application"
        title={`Apply: ${job.title}`}
        subtitle={job.company.companyProfile?.companyName ?? 'Company'}
        width="max-w-3xl"
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ApplyForm jobId={job.id} jobSlug={job.slug} resumes={resumes} />
      </div>
    </main>
  );
}
