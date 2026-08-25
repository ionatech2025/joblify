import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ChatThread } from '@/app/components/chat/chat-thread';
import { ChatComposer } from '@/app/components/chat/chat-composer';
import { LATEST_MESSAGES_TAKE, toThreadDisplay } from '@/app/components/chat/latest-messages';
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
  const { messages, truncated } = toThreadDisplay(area.messages);

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
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-3 py-3 sm:px-4 lg:grid-cols-[1fr_260px]">
        <section className="lg:col-span-2">
          <p className="text-fg-muted text-[13px]">
            {area.kind === 'VIRTUAL_INTERN'
              ? 'Your virtual-intern chat area.'
              : `Job-specific chat area for “${area.jobPost?.title ?? 'deleted job'}”.`}
          </p>
        </section>
        <section>
          {truncated && (
            <p className="mt-0 mb-3 text-xs text-fg-subtle">
              Showing the latest {LATEST_MESSAGES_TAKE} messages.
            </p>
          )}
          <ChatThread
            currentUserId={user.id}
            messages={messages.map((m) => ({
              id: m.id,
              senderId: m.senderId,
              senderName:
                [m.sender.firstName, m.sender.lastName].filter(Boolean).join(' ') || m.sender.email,
              kind: m.kind,
              body: m.body,
              attachmentUrl: m.attachmentUrl,
              createdAt: m.createdAt,
            }))}
          />
          <ChatComposer chatAreaId={area.id} />
        </section>

        <aside>
          <h2 className="mt-0 text-sm font-semibold tracking-wide text-fg-subtle uppercase">
            Participants
          </h2>
          <ul className="grid list-none grid-cols-1 gap-2 p-0">
            {area.participants.map((p) => (
              <li
                key={p.userId}
                className="rounded-card border border-border bg-surface px-3 py-2 text-sm shadow-soft"
              >
                <span className="font-medium text-fg">
                  {p.userId === user.id
                    ? 'You'
                    : [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') || 'Job seeker'}
                </span>
                {p.user.jobSeekerProfile && (
                  <span className="block text-xs text-fg-subtle">
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

          {candidates.length > 0 && (
            <>
              <h2 className="mt-6 text-sm font-semibold tracking-wide text-fg-subtle uppercase">
                {area.kind === 'VIRTUAL_INTERN' ? 'Add virtual interns' : 'Add applicants'}
              </h2>
              <ul className="grid list-none grid-cols-1 gap-2 p-0">
                {candidates.map((c) => (
                  <li
                    key={c.userId}
                    className="flex items-center justify-between gap-2 rounded-card border border-border bg-surface px-3 py-2 text-sm shadow-soft"
                  >
                    <span className="text-fg">{c.name}</span>
                    <AddParticipantButton chatAreaId={area.id} jobSeekerUserId={c.userId} />
                  </li>
                ))}
              </ul>
            </>
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
