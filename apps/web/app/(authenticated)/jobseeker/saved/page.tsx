import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { SavedList } from './saved-list';
import { SavedSearchList } from './saved-search-list';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { buttonClasses } from '@/app/components/ui/button';

export const metadata = { title: 'Saved' };

export default async function SavedJobsPage() {
  const user = await requireRole('JOB_SEEKER');
  const [savedJobs, savedSearches] = await Promise.all([
    db.savedJob.findMany({
      where: { userId: user.id, jobPost: { status: 'PUBLISHED', deletedAt: null } },
      orderBy: { createdAt: 'desc' },
      // Ceiling rather than paging: this list has no pager, and a saved list
      // long enough to hit 200 wants search, not a page 2.
      take: 200,
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
      // saveSearch caps a user at 20; this matches so the read can't outgrow it.
      take: 20,
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
    <main>
      <ControlPanel
        breadcrumb={<Breadcrumb items={[{ label: 'Saved' }]} />}
        actions={
          <Link href="/jobs" className={`${buttonClasses('secondary', 'sm')} no-underline`}>
            Browse jobs
          </Link>
        }
      />
      <ConsoleWidth className="max-w-5xl py-3">
        {savedSearches.length > 0 && (
          <section className="mt-0">
            <h2 className="text-lg font-semibold text-fg">Saved searches</h2>
            <p className="mt-1 text-sm text-fg-subtle">
              Re-run a search, or get new matches in your daily digest.
            </p>
            <SavedSearchList initial={savedSearches} />
          </section>
        )}

        <section className={savedSearches.length > 0 ? 'mt-8' : 'mt-0'}>
          <h2 className="text-lg font-semibold text-fg">Saved jobs</h2>
          <SavedList initial={jobs} />
        </section>
      </ConsoleWidth>
    </main>
  );
}
