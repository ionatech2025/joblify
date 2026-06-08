import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { SavedList } from './saved-list';

export const metadata = { title: 'Saved jobs' };

export default async function SavedJobsPage() {
  const user = await requireRole('JOB_SEEKER');
  const saved = await db.savedJob.findMany({
    where: { userId: user.id, jobPost: { status: 'PUBLISHED', deletedAt: null } },
    orderBy: { createdAt: 'desc' },
    select: {
      jobPost: {
        select: {
          id: true,
          slug: true,
          title: true,
          location: true,
          company: { select: { companyProfile: { select: { companyName: true } } } },
        },
      },
    },
  });

  const jobs = saved.map((s) => ({
    id: s.jobPost.id,
    slug: s.jobPost.slug,
    title: s.jobPost.title,
    company: s.jobPost.company.companyProfile?.companyName ?? 'Company',
    location: s.jobPost.location,
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-neutral-900">Saved jobs</h1>
      <SavedList initial={jobs} />
    </main>
  );
}
