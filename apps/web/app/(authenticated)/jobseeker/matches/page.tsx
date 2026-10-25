import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { getRecommendedJobs } from '@/lib/search/semantic-match';
import { Sparkles } from 'lucide-react';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { ListView, type ListColumn } from '@/app/components/console/list-view';
import { Badge } from '@/app/components/ui/badge';
import { EmptyState } from '@/app/components/ui/empty-state';
import { buttonClasses } from '@/app/components/ui/button';
import { matchTone } from '@/lib/ui/status';

export const metadata = { title: 'Matches' };

type MatchRow = Awaited<ReturnType<typeof getRecommendedJobs>>[number];

export default async function JobMatchesPage() {
  const user = await requireRole('JOB_SEEKER');
  const jobs = await getRecommendedJobs(user.id);

  const avgMatch =
    jobs.length > 0
      ? Math.round((jobs.reduce((n, j) => n + j.similarity, 0) / jobs.length) * 100)
      : null;

  const columns: ListColumn<MatchRow>[] = [
    {
      key: 'role',
      header: 'Role',
      cell: (j) => (
        <div className="min-w-0">
          <Link
            href={`/jobs/${j.slug}`}
            className="text-fg font-medium no-underline hover:underline"
          >
            {j.title}
          </Link>
          <span className="text-fg-muted block text-[12px] sm:hidden">
            {j.companyName}
            {j.location ? ` · ${j.location}` : ''}
          </span>
        </div>
      ),
      aggregate: () => `${jobs.length} matched role${jobs.length === 1 ? '' : 's'}`,
    },
    {
      key: 'company',
      header: 'Company',
      hideBelow: 'sm',
      cell: (j) => <span className="text-fg-muted">{j.companyName}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      hideBelow: 'md',
      cell: (j) => <span className="text-fg-muted">{j.location ?? '—'}</span>,
    },
    {
      key: 'match',
      header: 'Match',
      align: 'end',
      cell: (j) => (
        <Badge tone={matchTone(j.similarity)} className="tabular-nums">
          {Math.round(j.similarity * 100)}% match
        </Badge>
      ),
      aggregate: () => (avgMatch !== null ? `Avg ${avgMatch}%` : null),
    },
  ];

  return (
    <main>
      <ControlPanel
        breadcrumb={<Breadcrumb items={[{ label: 'Matches' }]} />}
        actions={
          <Link
            href="/jobseeker/resumes"
            className={`${buttonClasses('secondary', 'sm')} no-underline`}
          >
            Manage resumes
          </Link>
        }
      />
      <ConsoleWidth className="max-w-5xl py-3">
        <div className="o-sheet mb-3 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-[12px]">
          <p className="text-fg-muted m-0">
            Jobs ranked by semantic similarity to your most recent parsed résumé — not keyword
            overlap alone. Match scores are advisory and never auto-decide applications.
          </p>
          <Link href="/legal/ai" className="text-brand shrink-0 font-medium underline">
            How matching works
          </Link>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Sparkles />}
            title="No matches yet"
            description="Matches are computed from your resume. Upload or build one and they'll appear here once it has been processed."
            action={
              <Link href="/jobseeker/resumes" className={`${buttonClasses()} no-underline`}>
                Add a resume
              </Link>
            }
          />
        ) : (
          <ListView
            caption="Recommended job matches"
            rows={jobs}
            rowKey={(j) => j.id}
            columns={columns}
          />
        )}
      </ConsoleWidth>
    </main>
  );
}
