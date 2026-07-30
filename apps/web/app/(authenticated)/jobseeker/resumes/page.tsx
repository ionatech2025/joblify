import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ResumeManager } from './resume-manager';
import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'My resumes' };

export default async function ResumesPage() {
  const user = await requireRole('JOB_SEEKER');
  const rows = await db.resume.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, fileBlobUrl: true, parsedJson: true, createdAt: true },
  });
  const resumes = rows.map((r) => ({
    id: r.id,
    title: r.title,
    fileBlobUrl: r.fileBlobUrl,
    parsed: r.parsedJson != null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <main>
      <PageHeader
        title="My resumes"
        subtitle="Upload a PDF or Word resume. We parse it to autofill applications and compute your match score on every job."
        width="max-w-3xl"
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="m-0 text-sm text-fg-muted">
          Don't have a resume file handy?{' '}
          <Link href="/jobseeker/resumes/builder" className="text-brand hover:underline">
            Build one from your profile
          </Link>
          .
        </p>
        <ResumeManager userId={user.id} initialResumes={resumes} />
      </div>
    </main>
  );
}
