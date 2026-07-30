import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ChatThread } from '@/app/components/chat/chat-thread';
import { ChatComposer } from '@/app/components/chat/chat-composer';
import { LATEST_MESSAGES_TAKE, toThreadDisplay } from '@/app/components/chat/latest-messages';
import { PageHeader } from '@/app/components/ui/ambient';

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
      <PageHeader
        title={area.title}
        subtitle={
          area.jobPost
            ? `${companyName} · about the “${area.jobPost.title}” role.`
            : `${companyName} · virtual-intern chat area.`
        }
        width="max-w-3xl"
        actions={
          <Link href="/jobseeker/chats" className="text-sm text-brand hover:underline">
            ← All chats
          </Link>
        }
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {area.jobPost && (
          <p className="mb-6 text-sm text-fg-muted">
            Job post:{' '}
            <Link href={`/jobs/${area.jobPost.slug}`} className="text-brand hover:underline">
              {area.jobPost.title}
            </Link>
          </p>
        )}
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
