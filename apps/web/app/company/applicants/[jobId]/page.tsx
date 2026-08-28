import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { openJobChatArea } from '@/app/actions/chat';
import { ApplicantsBoard } from './applicants-board';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel, RecordPager } from '@/app/components/console/control-panel';
import { FacetChips, type Facet } from '@/app/components/console/search-view';
import { FilterMenu } from '@/app/components/console/filter-menu';
import { makeHref } from '@/lib/ui/list-params';
import { Button, buttonClasses } from '@/app/components/ui/button';

export const metadata = { title: 'Applicants' };

// The board is a kanban across five stage columns and has no paging of its own,
// so it needs a ceiling instead. Past this the banner below says so; deeper
// review belongs to a filtered view, not to one enormous board.
const BOARD_CAP = 200;

export default async function ApplicantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole('COMPANY');
  const { jobId } = await params;
  const sp = await searchParams;

  // Board view state. Both were `<select>`/checkbox controls rendered inside the
  // board; they are URL state, so they belong on the control panel — and the
  // sort now happens in the database rather than over the fetched array.
  const sort = sp.sort === 'match' ? 'match' : 'recent';
  const showClosed = sp.showClosed === '1';

  const job = await db.jobPost.findFirst({
    where: { id: jobId, companyId: user.id, deletedAt: null },
    include: { chatArea: { select: { id: true } } },
  });
  if (!job) notFound();

  const [applicantCount, applications, siblings] = await Promise.all([
    db.jobApplication.count({ where: { jobPostId: jobId } }),
    db.jobApplication.findMany({
      where: { jobPostId: jobId },
      orderBy:
        sort === 'match'
          ? // Unscored applications sort last rather than ahead of a 90% match,
            // which is what `(b.matchScore ?? -1)` used to approximate client-side.
            [{ matchScore: { sort: 'desc', nulls: 'last' } }, { appliedAt: 'desc' }]
          : [{ appliedAt: 'desc' }],
      // Previously unbounded, with three joins per row: a job with two thousand
      // applicants fetched and rendered two thousand full user + profile +
      // resume records. The board is a kanban and has no paging of its own, so
      // it takes a ceiling — the same answer /company/jobs already uses for its
      // kanban view (KANBAN_CAP there).
      take: BOARD_CAP,
      // `include` pulled every column of three tables to paint five fields.
      select: {
        id: true,
        status: true,
        appliedAt: true,
        matchScore: true,
        coverLetter: true,
        recruiterNotes: true,
        jobSeekerId: true,
        resume: { select: { fileBlobUrl: true } },
        jobSeeker: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            jobSeekerProfile: { select: { headline: true } },
          },
        },
      },
    }),
    // Ids only, in the same order the jobs list defaults to, so the record
    // pager walks the pipeline in the order the recruiter last saw it. This is
    // the fix for the console's worst dead end: reaching the next job's
    // applicants used to mean going back through the list every time.
    db.jobPost.findMany({
      where: { companyId: user.id, deletedAt: null },
      orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      // Ids only, so cheap — but still unbounded, and the pager needs the whole
      // ordered window to locate this job in it. Past the ceiling `position`
      // comes back -1 and the pager simply doesn't render, which is the right
      // degradation: no pager beats a pager that skips jobs.
      take: BOARD_CAP,
      select: { id: true },
    }),
  ]);

  const position = siblings.findIndex((s) => s.id === jobId);
  const href = makeHref(`/company/applicants/${jobId}`, sp);
  const facets: Facet[] = [
    ...(sort === 'match'
      ? [{ group: 'Sort', label: 'Highest match', removeHref: href({ sort: null }) }]
      : []),
    ...(showClosed
      ? [{ group: 'Stages', label: 'Including closed', removeHref: href({ showClosed: null }) }]
      : []),
  ];

  // Preserve the board's own sort/filter across a pager hop — moving to the
  // next job shouldn't silently reset "sort by match".
  const boardQs = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      v == null ? [] : [[k, Array.isArray(v) ? (v[0] ?? '') : v] as [string, string]],
    ),
  ).toString();
  const siblingHref = (index: number) => {
    const id = siblings[index]?.id;
    if (!id) return undefined;
    return `/company/applicants/${id}${boardQs ? `?${boardQs}` : ''}`;
  };

  return (
    <main>
      <ControlPanel
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Jobs', href: '/company/jobs' },
              { label: job.title, href: `/company/jobs/${job.id}/edit` },
              { label: 'Applicants' },
            ]}
          />
        }
        pager={
          position >= 0 && siblings.length > 1 ? (
            <RecordPager
              index={position + 1}
              total={siblings.length}
              label="job"
              prevHref={siblingHref(position - 1)}
              nextHref={siblingHref(position + 1)}
            />
          ) : undefined
        }
        search={
          <>
            <FilterMenu
              label="Sort"
              icon="ArrowDownWideNarrow"
              activeCount={sort === 'match' ? 1 : 0}
              groups={[
                {
                  items: [
                    { label: 'Most recent', href: href({ sort: null }), active: sort === 'recent' },
                    {
                      label: 'Highest match',
                      href: href({ sort: 'match' }),
                      active: sort === 'match',
                    },
                  ],
                },
              ]}
            />
            <FilterMenu
              label="Stages"
              icon="EyeOff"
              activeCount={showClosed ? 1 : 0}
              groups={[
                {
                  items: [
                    {
                      label: 'Show closed stages',
                      href: href({ showClosed: showClosed ? null : '1' }),
                      active: showClosed,
                    },
                  ],
                },
              ]}
            />
            <FacetChips facets={facets} clearHref={href({ sort: null, showClosed: null })} />
          </>
        }
        actions={
          job.chatArea ? (
            <Link
              href={`/company/chats/${job.chatArea.id}`}
              className={`${buttonClasses('secondary', 'sm')} no-underline`}
            >
              Open chat area
            </Link>
          ) : (
            <form action={openJobChatArea.bind(null, job.id)}>
              <Button type="submit" variant="secondary" size="sm">
                Create chat area
              </Button>
            </form>
          )
        }
      />
      <ConsoleWidth className="py-3">
        {/* No inline <Suspense> any more: the board used to read
            useSearchParams() for its own sort/showClosed state, which required
            a boundary. Those are now read on the server and passed down, so the
            board is a plain client island over already-ordered rows. */}
        {applicantCount > BOARD_CAP ? (
          <p className="text-warn bg-warn-subtle rounded-card border-warn/25 mb-2 border px-2.5 py-1.5 text-[12px]">
            Showing the first {BOARD_CAP} of {applicantCount} applicants, ordered by{' '}
            {sort === 'match' ? 'match score' : 'most recent'}.
          </p>
        ) : null}
        <ApplicantsBoard
          showClosed={showClosed}
          applications={applications.map((a) => ({
            id: a.id,
            status: a.status,
            appliedAt: a.appliedAt.toISOString(),
            matchScore: a.matchScore,
            coverLetter: a.coverLetter,
            recruiterNotes: a.recruiterNotes,
            resumeUrl: a.resume.fileBlobUrl,
            seeker: {
              id: a.jobSeekerId,
              firstName: a.jobSeeker.firstName ?? null,
              lastName: a.jobSeeker.lastName ?? null,
              email: a.jobSeeker.email,
              headline: a.jobSeeker.jobSeekerProfile?.headline ?? null,
            },
          }))}
        />
      </ConsoleWidth>
    </main>
  );
}
