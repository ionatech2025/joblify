'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './client';
import type { ChatMessagesResponse } from '@/app/api/v1/chats/[id]/messages/route';

/**
 * How often an open chat thread re-reads its messages.
 *
 * Chat has no push transport, and on this deployment it cannot have one:
 * Vercel Functions are request/response, so nothing can hold a WebSocket, and
 * an SSE stream is a billed running invocation that dies at the function's max
 * duration. Polling an open thread is the honest trade — one indexed read per
 * viewer per tick, and only while the thread is actually on screen.
 *
 * 10s rather than the notification list's 30s because this is a conversation
 * someone is looking at, and React Query suspends the interval entirely for a
 * hidden tab. refetchOnWindowFocus makes coming back instant regardless.
 *
 * If message volume ever justifies real push, the shape to reach for is a
 * managed realtime service published to from `sendChatMessage` — not a socket
 * server this app has nowhere to run.
 */
export const CHAT_POLL_MS = 10_000;

export function useChatMessages(chatAreaId: string, initialData: ChatMessagesResponse) {
  return useQuery({
    queryKey: queryKeys.chatMessages(chatAreaId),
    queryFn: async (): Promise<ChatMessagesResponse> => {
      const res = await fetch(`/api/v1/chats/${chatAreaId}/messages`);
      if (!res.ok)
        throw Object.assign(new Error('chat messages fetch failed'), { status: res.status });
      return res.json();
    },
    // The server already rendered this exact payload, so the thread paints from
    // SSR and the first poll is a background refresh — no loading flash, and no
    // duplicate request on mount.
    initialData,
    refetchInterval: CHAT_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

/**
 * Refresh the thread now.
 *
 * The composer needs this: sending goes through a Server Action, and a Server
 * Action revalidates the *route*, not React Query's cache. Once the thread
 * renders from this query, that route revalidation no longer reaches it — so
 * without an explicit invalidate your own message would sit invisible for up to
 * CHAT_POLL_MS, which is worse than the behaviour polling was added to improve.
 */
export function useRefreshChatMessages(chatAreaId: string): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(chatAreaId) });
  };
}
