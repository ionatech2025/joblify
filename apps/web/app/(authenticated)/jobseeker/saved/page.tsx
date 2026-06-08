import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { SavedList } from './saved-list';
import { SavedSearchList } from './saved-search-list';

export const metadata = { title: 'Saved' };

export default async function SavedJobsPage() {
  const user = await requireRole('JOB_SEEKER');
  const [savedJobs, savedSearches] = await Promise.all([
    db.savedJob.findMany({
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
    }),
    db.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, label: true, query: true },
    }),
  ]);

  const jobs = savedJobs.map((s) => ({
    id: s.jobPost.id,
    slug: s.jobPost.slug,
    title: s.jobPost.title,
    company: s.jobPost.company.companyProfile?.companyName ?? 'Company',
    location: s.jobPost.location,
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-neutral-900">Saved</h1>

      {savedSearches.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-900">Saved searches</h2>
          <p className="mt-1 text-sm text-neutral-500">Re-run a search, or get new matches in your daily digest.</p>
          <SavedSearchList initial={savedSearches} />
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900">Saved jobs</h2>
        <SavedList initial={jobs} />
      </section>
    </main>
  );
}
