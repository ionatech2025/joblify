import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { Filter, Users } from 'lucide-react';
import { EmptyState } from '@/app/components/ui/empty-state';
import { Badge } from '@/app/components/ui/badge';
import { buttonClasses } from '@/app/components/ui/button';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { FacetChips, type Facet } from '@/app/components/console/search-view';
import { FilterMenu } from '@/app/components/console/filter-menu';
import { ListView, type ListColumn } from '@/app/components/console/list-view';
import { makeHref } from '@/lib/ui/list-params';
import { ShareJobForm } from './share-job-form';
import { InviteButtons } from './invite-buttons';

const PATH = '/company/jobseekers';
const TYPE_LABEL = { EMPLOYABLE: 'Employable', VIRTUAL_INTERN: 'Virtual intern' } as const;

// The directory is a browse surface, not a search index — it shows the most
// recently active profiles rather than paging the whole seeker table. Stated in
// the UI when it bites, rather than truncating silently.
const DIRECTORY_CAP = 60;

export const metadata = { title: 'Job seekers' };

type SearchParams = Promise<{ filter?: string; type?: string }>;

type SeekerRow = {
  userId: string;
  name: string;
  headline: string | null;
  location: string | null;
  profileType: 'EMPLOYABLE' | 'VIRTUAL_INTERN';
  skills: string[];
  subscribed: boolean;
};

// Directory of job seekers (flowchart: "view job seekers' profiles — those on
// site / those subscribed"). "All" shows PUBLIC profiles; "Subscribed" shows
// this company's subscribers regardless of visibility, since subscribing is an
// explicit opt-in toward the company.
export default async function CompanyJobseekersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireRole('COMPANY');
  const params = await searchParams;
  const filter = params.filter === 'subscribed' ? 'subscribed' : 'all';
  const type =
    params.type === 'EMPLOYABLE' || params.type === 'VIRTUAL_INTERN' ? params.type : undefined;

  const [seekers, publishedJobs] = await Promise.all([
    filter === 'subscribed' ? getSubscribedSeekers(user.id, type) : getPublicSeekers(user.id, type),
    db.jobPost.findMany({
      where: { companyId: user.id, status: 'PUBLISHED', deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      // Feeds a filter dropdown; past this it wants a search box, not a longer list.
      take: 200,
      select: { id: true, title: true },
    }),
  ]);

  const href = makeHref(PATH, params);

  // Every filter that was a pill-tab row is now a control-panel menu plus a
  // removable facet: the previous UI expressed the query as two rows of five
  // toggles whose combined state you had to read off the buttons themselves,
  // and offered no way to clear it.
  const facets: Facet[] = [
    ...(filter === 'subscribed'
      ? [{ group: 'Audience', label: 'Subscribed to you', removeHref: href({ filter: null }) }]
      : []),
    ...(type ? [{ group: 'Type', label: TYPE_LABEL[type], removeHref: href({ type: null }) }] : []),
  ];

  const columns: ListColumn<SeekerRow>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (s) => (
        <div className="min-w-0">
          <span className="text-fg font-medium">{s.name}</span>
          {s.subscribed && (
            <Badge tone="brand" className="ml-2">
              Subscriber
            </Badge>
          )}
          {s.headline && (
            <p className="text-fg-subtle mt-0.5 truncate text-[12px]" title={s.headline}>
              {s.headline}
            </p>
          )}
        </div>
      ),
      aggregate: (rows) => `${rows.length} profile${rows.length === 1 ? '' : 's'}`,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (s) => <Badge tone="neutral">{TYPE_LABEL[s.profileType]}</Badge>,
    },
    {
      key: 'location',
      header: 'Location',
      hideBelow: 'sm',
      cell: (s) => <span className="text-fg-muted">{s.location ?? '—'}</span>,
    },
    {
      key: 'skills',
      header: 'Skills',
      hideBelow: 'lg',
      cell: (s) =>
        s.skills.length === 0 ? (
          <span className="text-fg-subtle">—</span>
        ) : (
          <span className="text-fg-muted" title={s.skills.join(', ')}>
            {s.skills.slice(0, 4).join(', ')}
            {s.skills.length > 4 ? ` +${s.skills.length - 4}` : ''}
          </span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (s) => (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {publishedJobs.length > 0 && (
            <ShareJobForm jobSeekerUserId={s.userId} publishedJobs={publishedJobs} />
          )}
          <InviteButtons
            jobSeekerUserId={s.userId}
            profileType={s.profileType}
            subscribed={s.subscribed}
          />
        </div>
      ),
    },
  ];

  return (
    <main>
      <ControlPanel
        breadcrumb={<Breadcrumb items={[{ label: 'Talent' }]} />}
        search={
          <>
            <FilterMenu
              label="Audience"
              icon={Users}
              activeCount={filter === 'subscribed' ? 1 : 0}
              groups={[
                {
                  items: [
                    { label: 'On site', href: href({ filter: null }), active: filter === 'all' },
                    {
                      label: 'Subscribed to you',
                      href: href({ filter: 'subscribed' }),
                      active: filter === 'subscribed',
                    },
                  ],
                },
              ]}
            />
            <FilterMenu
              label="Type"
              icon={Filter}
              activeCount={type ? 1 : 0}
              groups={[
                {
                  items: [
                    { label: 'All types', href: href({ type: null }), active: !type },
                    {
                      label: 'Employable',
                      href: href({ type: 'EMPLOYABLE' }),
                      active: type === 'EMPLOYABLE',
                    },
                    {
                      label: 'Virtual interns',
                      href: href({ type: 'VIRTUAL_INTERN' }),
                      active: type === 'VIRTUAL_INTERN',
                    },
                  ],
                },
              ]}
            />
            <FacetChips facets={facets} clearHref={href({ filter: null, type: null })} />
          </>
        }
      />
      <ConsoleWidth className="py-3">
        {seekers.length === DIRECTORY_CAP && (
          <p className="text-fg-subtle mb-2 text-[12px]">
            Showing the {DIRECTORY_CAP} most recently active profiles. Narrow with the filters above
            to see different ones.
          </p>
        )}
        {seekers.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title={filter === 'subscribed' ? 'No subscribers yet' : 'No profiles match this filter'}
            description={
              filter === 'subscribed'
                ? 'Seekers who subscribe to your company appear here, and you can invite them to roles directly.'
                : 'Try a different profile type, or check back as more seekers make their profiles public.'
            }
            action={
              facets.length > 0 ? (
                <Link href={PATH} className={`${buttonClasses('secondary')} no-underline`}>
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ListView
            caption="Job seeker directory"
            rows={seekers}
            rowKey={(s) => s.userId}
            columns={columns}
          />
        )}
      </ConsoleWidth>
    </main>
  );
}

async function getPublicSeekers(
  companyUserId: string,
  type?: 'EMPLOYABLE' | 'VIRTUAL_INTERN',
): Promise<SeekerRow[]> {
  const [profiles, subscriptions] = await Promise.all([
    db.jobSeekerProfile.findMany({
      where: {
        visibility: 'PUBLIC',
        ...(type ? { profileType: type } : {}),
        user: { deletedAt: null, userType: 'JOB_SEEKER' },
      },
      orderBy: { updatedAt: 'desc' },
      take: DIRECTORY_CAP,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        skills: { include: { skill: { select: { label: true } } } },
      },
    }),
    db.companySubscription.findMany({
      where: { companyId: companyUserId },
      // Read only to mark "already subscribed" on the visible DIRECTORY_CAP
      // profiles, so it never needs to be longer than the page it annotates.
      take: 1000,
      select: { jobSeekerId: true },
    }),
  ]);
  const subscribedIds = new Set(subscriptions.map((s) => s.jobSeekerId));

  return profiles.map((p) => ({
    userId: p.user.id,
    name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') || 'Job seeker',
    headline: p.headline,
    location: p.location,
    profileType: p.profileType,
    skills: p.skills.map((s) => s.skill.label),
    subscribed: subscribedIds.has(p.user.id),
  }));
}

async function getSubscribedSeekers(
  companyUserId: string,
  type?: 'EMPLOYABLE' | 'VIRTUAL_INTERN',
): Promise<SeekerRow[]> {
  const subscriptions = await db.companySubscription.findMany({
    where: { companyId: companyUserId, ...(type ? { profileType: type } : {}) },
    orderBy: { createdAt: 'desc' },
    take: DIRECTORY_CAP,
    include: {
      jobSeeker: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          deletedAt: true,
          jobSeekerProfile: {
            include: { skills: { include: { skill: { select: { label: true } } } } },
          },
        },
      },
    },
  });

  return subscriptions
    .filter((s) => !s.jobSeeker.deletedAt)
    .map((s) => ({
      userId: s.jobSeeker.id,
      name: [s.jobSeeker.firstName, s.jobSeeker.lastName].filter(Boolean).join(' ') || 'Job seeker',
      headline: s.jobSeeker.jobSeekerProfile?.headline ?? null,
      location: s.jobSeeker.jobSeekerProfile?.location ?? null,
      profileType: s.profileType,
      skills: s.jobSeeker.jobSeekerProfile?.skills.map((x) => x.skill.label) ?? [],
      subscribed: true,
    }));
}
