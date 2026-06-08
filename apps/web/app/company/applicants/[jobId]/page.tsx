import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ApplicantsBoard } from './applicants-board';

export const metadata = { title: 'Applicants' };

export default async function ApplicantsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const user = await requireRole('COMPANY');
  const { jobId } = await params;

  const job = await db.jobPost.findFirst({
    where: { id: jobId, companyId: user.id, deletedAt: null },
  });
  if (!job) notFound();

  const applications = await db.jobApplication.findMany({
    where: { jobPostId: jobId },
    orderBy: { appliedAt: 'desc' },
    include: {
      jobSeeker: { include: { jobSeekerProfile: true } },
      resume: true,
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="m-0 text-2xl font-bold text-neutral-900">Applicants for {job.title}</h1>
      <p className="mt-1 text-neutral-600">{applications.length} application(s)</p>

      <ApplicantsBoard
        applications={applications.map((a) => ({
          id: a.id,
          status: a.status,
          appliedAt: a.appliedAt.toISOString(),
          matchScore: a.matchScore,
          coverLetter: a.coverLetter,
          recruiterNotes: a.recruiterNotes,
          resumeUrl: a.resume.fileBlobUrl,
          seeker: {
            id: a.jobSeekerId,
            firstName: a.jobSeeker.firstName ?? null,
            lastName: a.jobSeeker.lastName ?? null,
            email: a.jobSeeker.email,
            headline: a.jobSeeker.jobSeekerProfile?.headline ?? null,
          },
        }))}
      />
    </main>
  );
}
