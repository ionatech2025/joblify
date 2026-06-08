import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ResumeManager } from './resume-manager';

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
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-neutral-900">My resumes</h1>
      <p className="mt-1 text-neutral-600">
        Upload a PDF or Word resume. We parse it to autofill applications and compute your match
        score on every job.
      </p>
      <ResumeManager userId={user.id} initialResumes={resumes} />
    </main>
  );
}
