import Link from 'next/link';
import type { JobPostStatus, Prisma } from '@prisma/client';
import { Briefcase, Filter, LayoutGrid, List, Plus } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { EmptyState } from '@/app/components/ui/empty-state';
import { Badge } from '@/app/components/ui/badge';
import { buttonClasses } from '@/app/components/ui/button';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel, ViewSwitcher } from '@/app/components/console/control-panel';
import { ListView, Pager, type ListColumn } from '@/app/components/console/list-view';
import { KanbanBoard, KanbanCard, KanbanColumn } from '@/app/components/console/kanban';
import { SearchBox, FacetChips, type Facet } from '@/app/components/console/search-view';
import { FilterMenu } from '@/app/components/console/filter-menu';
import { makeHref, orderParam, readListQuery } from '@/lib/ui/list-params';
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from './job-status';

export const metadata = { title: 'Jobs' };

const PATH = '/company/jobs';
const SORTABLE = ['title', 'status', 'applicants', 'posted'] as const;
const VIEWS = ['list', 'kanban'] as const;

// A kanban has no paging, so it needs a ceiling of its own. 200 cards across
// five columns is already past what anyone scans; the list view is the surface
// for going deeper, and `Pager` there states the real total.
const KANBAN_CAP = 200;

// Column order for the kanban and the status filter menu — the lifecycle of a
// post, not the enum's declaration order.
const STATUS_ORDER: JobPostStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'CLOSED',
  'ARCHIVED',
];

type Row = {
  id: string;
  slug: string;
  title: string;
  status: JobPostStatus;
  applicants: number;
  posted: Date;
  location: string | null;
};

export default async function CompanyJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole('COMPANY');
  const sp = await searchParams;

  const query = readListQuery(sp, {
    defaultSort: { key: 'posted', dir: 'desc' },
    sortable: SORTABLE,
    views: VIEWS,
  });
  const status = STATUS_ORDER.includes(sp.status as JobPostStatus)
    ? (sp.status as JobPostStatus)
    : undefined;
  const href = makeHref(PATH, sp);

  const where: Prisma.JobPostWhereInput = {
    companyId: user.id,
    deletedAt: null,
    ...(status ? { status } : {}),
    // Search covers the two fields a recruiter actually remembers a post by.
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: 'insensitive' as const } },
            { location: { contains: query.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  // Kanban shows the whole (filtered) pipeline; the list pages through it. The
  // groupBy powers the filter-menu counts and the kanban column counts from one
  // query instead of a count per status.
  const isKanban = query.view === 'kanban';
  // Plain numbers rather than a spread union: a conditional spread of
  // `{take}` vs `{skip,take}` widens `take` past Prisma's literal inference and
  // the whole findMany argument stops type-checking.
  const skip = isKanban ? 0 : query.offset;
  const take = isKanban ? KANBAN_CAP : query.limit;

  const [total, rows, byStatus] = await Promise.all([
    db.jobPost.count({ where }),
    db.jobPost.findMany({
      where,
      orderBy: ORDER_BY[query.sort.key as (typeof SORTABLE)[number]](query.sort.dir),
      // Previously unbounded: every post this company had ever created was
      // fetched and rendered on one page.
      skip,
      take,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        location: true,
        publishedAt: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
    }),
    db.jobPost.groupBy({
      by: ['status'],
      where: { companyId: user.id, deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const items: Row[] = rows.map((j) => ({
    id: j.id,
    slug: j.slug,
    title: j.title,
    status: j.status,
    applicants: j._count.applications,
    posted: j.publishedAt ?? j.createdAt,
    location: j.location,
  }));

  const statusCount = new Map(byStatus.map((g) => [g.status, g._count._all]));

  const facets: Facet[] = [
    ...(query.q ? [{ group: 'Search', label: query.q, removeHref: href({ q: null }) }] : []),
    ...(status
      ? [{ group: 'Status', label: JOB_STATUS_LABEL[status], removeHref: href({ status: null }) }]
      : []),
  ];

  return (
    <main>
      <ControlPanel
        breadcrumb={<Breadcrumb items={[{ label: 'Jobs' }]} />}
        actions={
          <Link
            href="/company/jobs/new"
            className={`${buttonClasses('primary', 'sm')} no-underline`}
          >
            <Plus aria-hidden className="size-3.5" />
            New
          </Link>
        }
        search={
          <>
            <SearchBox
              action={PATH}
              defaultValue={query.q}
              placeholder="Search jobs by title or location"
              // Carry the rest of the view through a search submission; `offset`
              // is deliberately absent, since a new query has no page 3.
              preserve={[
                ...(status ? ([['status', status]] as [string, string][]) : []),
                ...(query.view !== 'list' ? ([['view', query.view]] as [string, string][]) : []),
              ]}
              className="w-full max-w-xs"
            />
            <FilterMenu
              label="Status"
              icon={Filter}
              activeCount={status ? 1 : 0}
              groups={[
                {
                  items: STATUS_ORDER.map((s) => ({
                    label: `${JOB_STATUS_LABEL[s]} (${statusCount.get(s) ?? 0})`,
                    href: href({ status: status === s ? null : s }),
                    active: status === s,
                  })),
                },
              ]}
            />
            <FacetChips facets={facets} clearHref={href({ q: null, status: null })} />
          </>
        }
        views={
          <ViewSwitcher
            active={query.view}
            views={[
              { key: 'list', label: 'List', icon: List, href: href({ view: null }) },
              { key: 'kanban', label: 'Kanban', icon: LayoutGrid, href: href({ view: 'kanban' }) },
            ]}
          />
        }
      />

      <ConsoleWidth className="py-3">
        {total === 0 ? (
          <EmptyState
            icon={<Briefcase />}
            title={facets.length > 0 ? 'No jobs match these filters' : 'No job posts yet'}
            description={
              facets.length > 0
                ? 'Clear a filter, or widen the search to see more of your pipeline.'
                : 'Publish a role and it appears in search, on your company page, and in seekers’ matches.'
            }
            action={
              facets.length > 0 ? (
                <Link href={PATH} className={`${buttonClasses('secondary')} no-underline`}>
                  Clear filters
                </Link>
              ) : (
                <Link href="/company/jobs/new" className={`${buttonClasses()} no-underline`}>
                  Post your first job
                </Link>
              )
            }
          />
        ) : isKanban ? (
          <>
            {total > KANBAN_CAP ? (
              <p className="text-warn bg-warn-subtle rounded-card border-warn/25 mb-2 border px-2.5 py-1.5 text-[12px]">
                Showing the first {KANBAN_CAP} of {total} jobs. Switch to the list view to page
                through all of them.
              </p>
            ) : null}
            <KanbanBoard>
              {STATUS_ORDER.map((s) => {
                const cards = items.filter((i) => i.status === s);
                const applicants = cards.reduce((n, c) => n + c.applicants, 0);
                return (
                  <KanbanColumn
                    key={s}
                    title={JOB_STATUS_LABEL[s]}
                    count={cards.length}
                    aggregate={
                      cards.length > 0
                        ? `${applicants} applicant${applicants === 1 ? '' : 's'}`
                        : undefined
                    }
                  >
                    {cards.map((j) => (
                      <KanbanCard key={j.id}>
                        <Link
                          href={`/company/jobs/${j.id}/edit`}
                          className="text-fg block font-semibold no-underline hover:underline"
                        >
                          {j.title}
                        </Link>
                        {j.location ? (
                          <p className="text-fg-subtle mt-0.5 text-[11px]">{j.location}</p>
                        ) : null}
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <Link
                            href={`/company/applicants/${j.id}`}
                            className="text-brand text-[12px] no-underline hover:underline"
                          >
                            {j.applicants} applicant{j.applicants === 1 ? '' : 's'}
                          </Link>
                          <span className="text-fg-subtle text-[11px]">
                            {j.posted.toLocaleDateString()}
                          </span>
                        </div>
                      </KanbanCard>
                    ))}
                  </KanbanColumn>
                );
              })}
            </KanbanBoard>
          </>
        ) : (
          <>
            <ListView
              caption="Job posts"
              rows={items}
              rowKey={(j) => j.id}
              sort={query.sort}
              hrefForSort={(key, dir) => href({ order: orderParam(key, dir) })}
              columns={COLUMNS(total)}
            />
            <Pager
              offset={query.offset}
              limit={query.limit}
              total={total}
              label="jobs"
              hrefForOffset={(offset) => href({ offset })}
            />
          </>
        )}
      </ConsoleWidth>
    </main>
  );
}

// Sort is expressed in the database, not over the fetched page — sorting one
// page of 20 by applicant count would silently mean "the top of page 1", not
// "the top of the pipeline".
const ORDER_BY: Record<
  (typeof SORTABLE)[number],
  (dir: 'asc' | 'desc') => Prisma.JobPostOrderByWithRelationInput[]
> = {
  title: (dir) => [{ title: dir }],
  status: (dir) => [{ status: dir }, { createdAt: 'desc' }],
  applicants: (dir) => [{ applications: { _count: dir } }, { createdAt: 'desc' }],
  // Drafts have no publishedAt; they sort to the end rather than to the top.
  posted: (dir) => [{ publishedAt: { sort: dir, nulls: 'last' } }, { createdAt: dir }],
};

function COLUMNS(total: number): ListColumn<Row>[] {
  return [
    {
      key: 'title',
      header: 'Title',
      sort: 'title',
      cell: (j) => (
        <div className="min-w-0">
          <Link
            href={`/jobs/${j.slug}`}
            className="text-fg font-medium no-underline hover:underline"
          >
            {j.title}
          </Link>
          {j.location ? (
            <span className="text-fg-subtle ml-2 text-[12px]">{j.location}</span>
          ) : null}
        </div>
      ),
      aggregate: () => `${total} job${total === 1 ? '' : 's'}`,
    },
    {
      key: 'status',
      header: 'Status',
      sort: 'status',
      cell: (j) => <Badge tone={JOB_STATUS_TONE[j.status]}>{JOB_STATUS_LABEL[j.status]}</Badge>,
    },
    {
      key: 'applicants',
      header: 'Applicants',
      sort: 'applicants',
      align: 'end',
      cell: (j) => (
        <Link
          href={`/company/applicants/${j.id}`}
          className="text-brand no-underline hover:underline"
        >
          {j.applicants}
        </Link>
      ),
      // The aggregate is over the visible page, and says so, rather than
      // implying it covers every job the filters matched.
      aggregate: (rows) => rows.reduce((n, r) => n + r.applicants, 0),
    },
    {
      key: 'posted',
      header: 'Posted',
      sort: 'posted',
      align: 'end',
      hideBelow: 'sm',
      cell: (j) => <span className="text-fg-muted">{j.posted.toLocaleDateString()}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (j) => (
        <Link
          href={`/company/jobs/${j.id}/edit`}
          className="text-brand no-underline hover:underline"
        >
          Edit
        </Link>
      ),
    },
  ];
}
