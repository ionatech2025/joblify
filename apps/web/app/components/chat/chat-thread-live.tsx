'use client';

import { ChatThread } from './chat-thread';
import { LATEST_MESSAGES_TAKE } from './latest-messages';
import { useChatMessages } from '@/lib/query/chat';
import type { ChatMessagesResponse } from '@/app/api/v1/chats/[id]/messages/route';

/**
 * A chat thread that keeps up with the other participant.
 *
 * <ChatThread> stays purely presentational; this is the thin client shell that
 * re-reads the messages on an interval. The thread was previously a plain
 * server render, so a message from the other side only appeared on a manual
 * reload — your own appeared because the Server Action revalidated the route.
 *
 * `initial` is the same payload the page already rendered, handed to React
 * Query as initialData: the SSR markup stays on screen, there is no loading
 * state, and the first network request is a background refresh.
 */
export function ChatThreadLive({
  chatAreaId,
  currentUserId,
  initial,
}: {
  chatAreaId: string;
  currentUserId: string;
  initial: ChatMessagesResponse;
}) {
  const { data } = useChatMessages(chatAreaId, initial);

  return (
    <>
      {data.truncated && (
        <p className="text-fg-subtle mt-0 mb-3 text-xs">
          Showing the latest {LATEST_MESSAGES_TAKE} messages.
        </p>
      )}
      <ChatThread currentUserId={currentUserId} messages={data.messages} />
    </>
  );
}
