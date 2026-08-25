import { Suspense } from 'react';
import Link from 'next/link';
import { Filter } from 'lucide-react';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ApplicationsList } from './applications-list';
import { RecentlyViewed } from '../recently-viewed';
import type { ApplicationListItem } from '@/lib/query/applications';
import { APPLICATIONS_PAGE_CAP } from '@/lib/query/client';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { FacetChips, type Facet } from '@/app/components/console/search-view';
import { FilterMenu } from '@/app/components/console/filter-menu';
import { makeHref } from '@/lib/ui/list-params';
import { APPLICATION_STAGES, applicationStatusLabel } from '@/lib/ui/status';

export const metadata = { title: 'My applications' };

const PATH = '/jobseeker/applications';

export default async function JobseekerApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole('JOB_SEEKER');
  const sp = await searchParams;
  const href = makeHref(PATH, sp);
  const status = APPLICATION_STAGES.some((s) => s.status === sp.status)
    ? (sp.status as string)
    : undefined;

  // JOB_UC_09.0: real-time application tracking is a premium feature. Every
  // account defaults to PRO today, so this renders the list for everyone —
  // the banner only appears once a FREE tier actually exists.
  if (user.plan !== 'PRO') {
    return (
      <main>
        <ControlPanel breadcrumb={<Breadcrumb items={[{ label: 'Applications' }]} />} />
        <ConsoleWidth className="max-w-3xl py-3">
          <div className="o-sheet bg-brand-subtle px-4 py-5 text-center">
            <p className="text-fg m-0 font-semibold">Track your applications with Pro</p>
            <p className="text-fg-muted mt-1 mb-0 text-[13px]">
              See real-time status — viewed, shortlisted, interview, and outcome — for every job
              you&apos;ve applied to.
            </p>
          </div>
        </ConsoleWidth>
      </main>
    );
  }

  const [rows, total] = await Promise.all([
    db.jobApplication.findMany({
      where: { jobSeekerId: user.id },
      orderBy: { appliedAt: 'desc' },
      include: {
        jobPost: { include: { company: { include: { companyProfile: true } } } },
      },
      take: APPLICATIONS_PAGE_CAP,
    }),
    // Counted separately so the list can say "50 of 137" rather than
    // truncating at the cap with nothing on screen admitting it.
    db.jobApplication.count({ where: { jobSeekerId: user.id } }),
  ]);

  const initialData: ApplicationListItem[] = rows.map((r) => ({
    id: r.id,
    jobPostId: r.jobPostId,
    slug: r.jobPost.slug,
    jobTitle: r.jobPost.title,
    companyName: r.jobPost.company.companyProfile?.companyName ?? 'Company',
    status: r.status,
    appliedAt: r.appliedAt.toISOString(),
    matchScore: r.matchScore,
  }));

  // Counts come off the loaded page, which is what the list filters over, so
  // the menu can never offer a status that would yield an empty view.
  const counts = new Map<string, number>();
  for (const a of initialData) counts.set(a.status, (counts.get(a.status) ?? 0) + 1);

  const facets: Facet[] = status
    ? [
        {
          group: 'Status',
          label: applicationStatusLabel(status),
          removeHref: href({ status: null }),
        },
      ]
    : [];

  return (
    <main>
      <ControlPanel
        breadcrumb={<Breadcrumb items={[{ label: 'Applications' }]} />}
        search={
          <>
            <FilterMenu
              label="Status"
              icon={Filter}
              activeCount={status ? 1 : 0}
              groups={[
                {
                  items: APPLICATION_STAGES.filter((s) => (counts.get(s.status) ?? 0) > 0).map(
                    (s) => ({
                      label: `${s.label} (${counts.get(s.status)})`,
                      href: href({ status: status === s.status ? null : s.status }),
                      active: status === s.status,
                    }),
                  ),
                },
              ]}
            />
            <FacetChips facets={facets} clearHref={href({ status: null })} />
          </>
        }
        actions={
          <Link
            href="/jobs"
            className="border-border text-fg-muted hover:bg-surface-sunken hover:text-fg rounded-control border px-2.5 py-1 text-[13px] no-underline transition-colors"
          >
            Find a role
          </Link>
        }
      />
      <ConsoleWidth className="max-w-6xl py-3">
        {sp.just_applied && (
          <p className="rounded-card bg-success-subtle text-success-subtle-fg border-success/25 mb-2 border px-2.5 py-1.5 text-[13px]">
            Application submitted — you&apos;ll get an email when the team updates the status.
          </p>
        )}
        {/* ApplicationsList reads useSearchParams() for the status filter the
            control panel above writes, so it needs a Suspense ancestor. */}
        <Suspense fallback={null}>
          <ApplicationsList userId={user.id} initialData={initialData} total={total} />
        </Suspense>
        <Suspense fallback={null}>
          <RecentlyViewed userId={user.id} />
        </Suspense>
      </ConsoleWidth>
    </main>
  );
}
