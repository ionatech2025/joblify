import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { SavedList, type SavedRow } from './saved-list';
import { SavedSearchList } from './saved-search-list';
import { applicationsClosed } from '@/app/(marketing)/jobs/[slug]/deadline';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { buttonClasses } from '@/app/components/ui/button';

export const metadata = { title: 'Saved' };

const SAVED_JOBS_HEADING = 'saved-jobs-heading';
const SAVED_SEARCHES_HEADING = 'saved-searches-heading';

export default async function SavedJobsPage() {
  const user = await requireRole('JOB_SEEKER');
  const [savedJobs, savedSearches] = await Promise.all([
    db.savedJob.findMany({
      where: { userId: user.id, jobPost: { deletedAt: null } },
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
            status: true,
            applicationDeadline: true,
            company: {
              select: { deletedAt: true, companyProfile: { select: { companyName: true } } },
            },
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

  const jobs: SavedRow[] = savedJobs.map(({ jobPost: j }) => ({
    id: j.id,
    slug: j.slug,
    title: j.title,
    company: j.company.companyProfile?.companyName ?? 'Company',
    location: j.location,
    availability:
      j.status !== 'PUBLISHED' || j.company.deletedAt
        ? 'removed'
        : applicationsClosed(j.applicationDeadline)
          ? 'closed'
          : 'open',
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
        <section>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 id={SAVED_JOBS_HEADING} tabIndex={-1} className="text-fg text-[14px] font-semibold">
              Saved jobs
            </h2>
            <span className="text-fg-muted text-[12px] tabular-nums">
              {jobs.length} {jobs.length === 1 ? 'role' : 'roles'}
            </span>
          </div>
          <SavedList initial={jobs} focusFallbackId={SAVED_JOBS_HEADING} />
        </section>

        <section className="mt-6">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <h2
              id={SAVED_SEARCHES_HEADING}
              tabIndex={-1}
              className="text-fg text-[14px] font-semibold"
            >
              Saved searches
            </h2>
            <span className="text-fg-muted text-[12px] tabular-nums">
              {savedSearches.length} / 20
            </span>
          </div>
          <p className="text-fg-muted mb-2 text-[12px]">
            Re-run a search in one click, or get new matches in your daily digest.
          </p>
          <SavedSearchList initial={savedSearches} focusFallbackId={SAVED_SEARCHES_HEADING} />
        </section>
      </ConsoleWidth>
    </main>
  );
}
