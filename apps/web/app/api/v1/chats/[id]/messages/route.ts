import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  LATEST_MESSAGES_TAKE,
  toChatMessages,
  type ChatMessageDTO,
} from '@/app/components/chat/latest-messages';

export type ChatMessagesResponse = {
  messages: ChatMessageDTO[];
  truncated: boolean;
};

const MESSAGE_SELECT = {
  id: true,
  senderId: true,
  kind: true,
  body: true,
  attachmentUrl: true,
  createdAt: true,
  sender: { select: { firstName: true, lastName: true, email: true } },
} as const;

/**
 * The polled read behind an open chat thread.
 *
 * Access is membership, re-derived here rather than trusted from the client —
 * the same rule `sendChatMessage` applies on every post. A company owns its
 * areas; anyone else must hold a ChatParticipant row. A non-member gets 404,
 * not 403, so this cannot be used to probe which area ids exist.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { id } = await params;

  const area = await db.chatArea.findFirst({
    where: {
      id,
      OR: [{ companyId: user.id }, { participants: { some: { userId: user.id } } }],
    },
    select: {
      companyId: true,
      company: { select: { companyProfile: { select: { companyName: true } } } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: LATEST_MESSAGES_TAKE,
        select: MESSAGE_SELECT,
      },
    },
  });
  if (!area) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Mirror each page's own fallback so a poll can't rename a sender mid-thread:
  // the company's own messages read as the company, everyone else falls back to
  // the address that identifies them.
  const companyName = area.company.companyProfile?.companyName ?? 'Company';
  const body: ChatMessagesResponse = toChatMessages(area.messages, (m) =>
    m.senderId === area.companyId ? companyName : m.sender.email,
  );

  // Per-user content: never let a shared cache hold it.
  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
