import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ChatThread } from '@/app/components/chat/chat-thread';
import { ChatComposer } from '@/app/components/chat/chat-composer';
import { LATEST_MESSAGES_TAKE, toThreadDisplay } from '@/app/components/chat/latest-messages';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';

export const metadata = { title: 'Chat' };

type Params = Promise<{ id: string }>;

// Seeker view of a chat area. Access = membership; sendChatMessage re-checks
// on every post.
export default async function JobseekerChatAreaPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireRole('JOB_SEEKER');

  const membership = await db.chatParticipant.findUnique({
    where: { chatAreaId_userId: { chatAreaId: id, userId: user.id } },
    include: {
      chatArea: {
        include: {
          company: { select: { companyProfile: { select: { companyName: true } } } },
          jobPost: { select: { title: true, slug: true } },
          // Newest window of the thread; toThreadDisplay flips it back to
          // chronological order below.
          messages: {
            orderBy: { createdAt: 'desc' },
            take: LATEST_MESSAGES_TAKE,
            include: { sender: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
      },
    },
  });
  if (!membership) notFound();

  const area = membership.chatArea;
  const companyName = area.company.companyProfile?.companyName ?? 'Company';
  const { messages, truncated } = toThreadDisplay(area.messages);

  return (
    <main>
      {/* The "All chats" back-link is gone — the breadcrumb's first crumb is
          that link. */}
      <ControlPanel
        breadcrumb={
          <Breadcrumb
            items={[{ label: 'Chats', href: '/jobseeker/chats' }, { label: area.title }]}
          />
        }
      />
      <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-4">
        <p className="text-fg-muted mb-2 text-[13px]">
          {companyName}
          {area.jobPost ? (
            <>
              {' · about the '}
              <Link href={`/jobs/${area.jobPost.slug}`} className="text-brand underline">
                {area.jobPost.title}
              </Link>
              {' role.'}
            </>
          ) : (
            ' · virtual-intern chat area.'
          )}
        </p>
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
              [m.sender.firstName, m.sender.lastName].filter(Boolean).join(' ') || companyName,
            kind: m.kind,
            body: m.body,
            attachmentUrl: m.attachmentUrl,
            createdAt: m.createdAt,
          }))}
        />
        <ChatComposer chatAreaId={area.id} />
      </div>
    </main>
  );
}
