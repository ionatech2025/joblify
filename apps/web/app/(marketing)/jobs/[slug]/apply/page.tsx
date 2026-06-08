import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ApplyForm } from './apply-form';

type Params = Promise<{ slug: string }>;

export const metadata = { title: 'Apply' };

export default async function ApplyPage({ params }: { params: Params }) {
  const { slug } = await params;
  // The body is fully dynamic (auth + per-user resume list), so it streams
  // inside a Suspense boundary as cacheComponents requires.
  return (
    <Suspense fallback={null}>
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
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-neutral-900">Apply: {job.title}</h1>
      <p className="mt-1 mb-8 text-neutral-600">{job.company.companyProfile?.companyName ?? 'Company'}</p>
      <ApplyForm jobId={job.id} jobSlug={job.slug} resumes={resumes} />
    </main>
  );
}
