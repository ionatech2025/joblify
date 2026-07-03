import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ChatThread } from '@/app/components/chat/chat-thread';
import { ChatComposer } from '@/app/components/chat/chat-composer';
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
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 100,
            include: { sender: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
      },
    },
  });
  if (!membership) notFound();

  const area = membership.chatArea;
  const companyName = area.company.companyProfile?.companyName ?? 'Company';

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
          <Link href="/jobseeker/chats" className="text-sm text-indigo-700 hover:underline">
            ← All chats
          </Link>
        }
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {area.jobPost && (
          <p className="mb-6 text-sm text-neutral-600">
            Job post:{' '}
            <Link href={`/jobs/${area.jobPost.slug}`} className="text-indigo-700 hover:underline">
              {area.jobPost.title}
            </Link>
          </p>
        )}
        <ChatThread
          currentUserId={user.id}
          messages={area.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: [m.sender.firstName, m.sender.lastName].filter(Boolean).join(' ') || companyName,
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
