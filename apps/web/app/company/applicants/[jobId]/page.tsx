import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { openJobChatArea } from '@/app/actions/chat';
import { ApplicantsBoard } from './applicants-board';
import { ApplicantsBoardSkeleton } from './applicants-board-skeleton';
import { PageHeader } from '@/app/components/ui/ambient';
import { Button, buttonClasses } from '@/app/components/ui/button';

export const metadata = { title: 'Applicants' };

export default async function ApplicantsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const user = await requireRole('COMPANY');
  const { jobId } = await params;

  const job = await db.jobPost.findFirst({
    where: { id: jobId, companyId: user.id, deletedAt: null },
    include: { chatArea: { select: { id: true } } },
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
    <main>
      <PageHeader
        title={`Applicants for ${job.title}`}
        subtitle={`${applications.length} application(s) · shortlisted applicants join the job's chat area automatically`}
        actions={
          job.chatArea ? (
            <Link
              href={`/company/chats/${job.chatArea.id}`}
              className={`${buttonClasses('primary')} no-underline`}
            >
              Open chat area
            </Link>
          ) : (
            <form action={openJobChatArea.bind(null, job.id)}>
              <Button type="submit" variant="secondary">
                Create chat area
              </Button>
            </form>
          )
        }
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* ApplicantsBoard reads useSearchParams() — must sit inside a Suspense
            boundary. Fallback shares the shape with this route's loading.tsx —
            see applicants-board-skeleton.tsx. */}
        <Suspense fallback={<ApplicantsBoardSkeleton />}>
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
        </Suspense>
      </div>
    </main>
  );
}
