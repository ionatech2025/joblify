import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ChatThreadLive } from '@/app/components/chat/chat-thread-live';
import { ChatComposer } from '@/app/components/chat/chat-composer';
import { LATEST_MESSAGES_TAKE, toChatMessages } from '@/app/components/chat/latest-messages';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { AddParticipantButton } from './add-participant-button';

export const metadata = { title: 'Chat area' };

type Params = Promise<{ id: string }>;

// Company view of a chat area: thread + composer, participant list, and the
// pool of candidates who can still be added (flowchart: "add seeker of choice
// to job specific chat area" / "add virtual interns of interest").
export default async function CompanyChatAreaPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireRole('COMPANY');

  const area = await db.chatArea.findFirst({
    where: { id, companyId: user.id },
    include: {
      jobPost: { select: { id: true, title: true } },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jobSeekerProfile: { select: { profileType: true, headline: true } },
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
      // Newest window of the thread; toThreadDisplay flips it back to
      // chronological order below.
      messages: {
        orderBy: { createdAt: 'desc' },
        take: LATEST_MESSAGES_TAKE,
        include: { sender: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
  });
  if (!area) notFound();

  const participantIds = new Set(area.participants.map((p) => p.userId));
  const candidates = await getAddableSeekers(area, user.id, participantIds);
  // A candidate with no name on file still has to be identifiable to the
  // recruiter reading the thread.
  const initial = toChatMessages(area.messages, (m) => m.sender.email);

  return (
    <main>
      {/* The "All chat areas" back-link is gone: the breadcrumb's first crumb is
          that link, and having both put two different affordances for the same
          navigation on one bar. */}
      <ControlPanel
        breadcrumb={
          <Breadcrumb items={[{ label: 'Chats', href: '/company/chats' }, { label: area.title }]} />
        }
      />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-4 px-3 py-3 sm:px-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="lg:col-span-2">
          <p className="text-fg-muted text-[13px]">
            {area.kind === 'VIRTUAL_INTERN'
              ? 'Your virtual-intern chat area.'
              : `Job-specific chat area for “${area.jobPost?.title ?? 'deleted job'}”.`}
          </p>
        </section>
        <section>
          <ChatThreadLive chatAreaId={area.id} currentUserId={user.id} initial={initial} />
          <ChatComposer chatAreaId={area.id} />
        </section>

        <aside className="o-sheet flex flex-col gap-4 p-3.5">
          <div>
            <div className="border-border mb-2 flex items-center justify-between border-b pb-1.5">
              <h2 className="text-fg-muted m-0 text-[12px] font-semibold tracking-wider uppercase">
                Participants
              </h2>
              <span className="text-fg-subtle text-[12px] font-semibold tabular-nums">
                {area.participants.length}
              </span>
            </div>
            <ul className="m-0 grid list-none grid-cols-1 gap-1.5 p-0">
              {area.participants.map((p) => (
                <li
                  key={p.userId}
                  className="rounded-control border-border bg-surface-sunken/60 border px-2.5 py-2 text-[13px]"
                >
                  <span className="text-fg font-medium">
                    {p.userId === user.id
                      ? 'You'
                      : [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') ||
                        'Job seeker'}
                  </span>
                  {p.user.jobSeekerProfile && (
                    <span className="text-fg-subtle block text-[12px]">
                      {p.user.jobSeekerProfile.profileType === 'VIRTUAL_INTERN'
                        ? 'Virtual intern'
                        : 'Employable'}
                      {p.user.jobSeekerProfile.headline
                        ? ` · ${p.user.jobSeekerProfile.headline}`
                        : ''}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {candidates.length > 0 && (
            <div>
              <div className="border-border mb-2 flex items-center justify-between border-b pb-1.5">
                <h2 className="text-fg-muted m-0 text-[12px] font-semibold tracking-wider uppercase">
                  {area.kind === 'VIRTUAL_INTERN' ? 'Add virtual interns' : 'Add applicants'}
                </h2>
                <span className="text-fg-subtle text-[12px] font-semibold tabular-nums">
                  {candidates.length}
                </span>
              </div>
              <ul className="m-0 grid list-none grid-cols-1 gap-1.5 p-0">
                {candidates.map((c) => (
                  <li
                    key={c.userId}
                    className="rounded-control border-border bg-surface flex items-center justify-between gap-2 border px-2.5 py-1.5 text-[13px]"
                  >
                    <span className="text-fg truncate">{c.name}</span>
                    <AddParticipantButton chatAreaId={area.id} jobSeekerUserId={c.userId} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

// JOB areas draw from that job's applicants; the VIRTUAL_INTERN area draws
// from the company's virtual-intern subscribers.
async function getAddableSeekers(
  area: { kind: 'JOB' | 'VIRTUAL_INTERN'; jobPost: { id: string } | null },
  companyUserId: string,
  participantIds: Set<string>,
): Promise<Array<{ userId: string; name: string }>> {
  if (area.kind === 'JOB') {
    if (!area.jobPost) return [];
    const applications = await db.jobApplication.findMany({
      where: { jobPostId: area.jobPost.id, jobSeeker: { deletedAt: null } },
      orderBy: { appliedAt: 'desc' },
      take: 50,
      select: { jobSeeker: { select: { id: true, firstName: true, lastName: true } } },
    });
    return applications
      .filter((a) => !participantIds.has(a.jobSeeker.id))
      .map((a) => ({
        userId: a.jobSeeker.id,
        name:
          [a.jobSeeker.firstName, a.jobSeeker.lastName].filter(Boolean).join(' ') || 'Job seeker',
      }));
  }

  const subscriptions = await db.companySubscription.findMany({
    where: {
      companyId: companyUserId,
      profileType: 'VIRTUAL_INTERN',
      jobSeeker: { deletedAt: null },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { jobSeeker: { select: { id: true, firstName: true, lastName: true } } },
  });
  return subscriptions
    .filter((s) => !participantIds.has(s.jobSeeker.id))
    .map((s) => ({
      userId: s.jobSeeker.id,
      name: [s.jobSeeker.firstName, s.jobSeeker.lastName].filter(Boolean).join(' ') || 'Job seeker',
    }));
}
