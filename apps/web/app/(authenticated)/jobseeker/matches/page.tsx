import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { getRecommendedJobs } from '@/lib/search/semantic-match';
import { Sparkles } from 'lucide-react';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { Badge } from '@/app/components/ui/badge';
import { EmptyState } from '@/app/components/ui/empty-state';
import { buttonClasses } from '@/app/components/ui/button';
import { matchTone } from '@/lib/ui/status';

export const metadata = { title: 'Matches' };

export default async function JobMatchesPage() {
  const user = await requireRole('JOB_SEEKER');
  const jobs = await getRecommendedJobs(user.id);

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
        <p className="text-fg-muted mb-2 text-[13px]">
          Jobs ranked by how closely they match your resume — not just keyword overlap.
        </p>
        {jobs.length === 0 ? (
          <EmptyState
            className="mt-6"
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
          <ul className="mt-4 flex list-none flex-col gap-2 p-0">
            {jobs.map((j) => (
              <li
                key={j.id}
                className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface px-4 py-3"
              >
                <Link href={`/jobs/${j.slug}`} className="min-w-0 text-fg no-underline hover:underline">
                  <strong>{j.title}</strong>
                  <span className="text-fg-muted">
                    {' — '}
                    {j.companyName}
                    {j.location ? ` · ${j.location}` : ''}
                  </span>
                </Link>
                <Badge tone={matchTone(j.similarity)} className="shrink-0">
                  {Math.round(j.similarity * 100)}% match
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </ConsoleWidth>
    </main>
  );
}
