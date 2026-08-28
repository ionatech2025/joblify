import type { ChatMessageKind } from '@prisma/client';

// Chat threads page from the newest end of history: the thread pages query the
// latest LATEST_MESSAGES_TAKE messages (`orderBy createdAt desc`), and this
// helper flips that page back into chronological order for <ChatThread>.
// `truncated` — an exactly-full window — means older messages exist beyond it,
// which the pages surface as a "Showing the latest N messages" note.
export const LATEST_MESSAGES_TAKE = 100;

export function toThreadDisplay<T>(newestFirst: T[]): { messages: T[]; truncated: boolean } {
  return {
    messages: [...newestFirst].reverse(),
    truncated: newestFirst.length >= LATEST_MESSAGES_TAKE,
  };
}

/**
 * One message, as both the server render and the poll produce it.
 *
 * `createdAt` is an ISO string rather than a Date on purpose: the server page
 * and `/api/v1/chats/[id]/messages` must produce byte-identical objects, and a
 * Date does not survive JSON. <TimeStamp> accepts either.
 *
 * This module has no 'use client' directive, so the pages, the Route Handler
 * and the client components can all import from it — the same reason
 * APPLICATIONS_PAGE_CAP lives in lib/query/client.ts.
 */
export type ChatMessageDTO = {
  id: string;
  senderId: string;
  senderName: string;
  kind: ChatMessageKind;
  body: string;
  attachmentUrl: string | null;
  createdAt: string;
};

/** The Prisma shape both thread pages and the Route Handler select. */
type RawMessage = {
  id: string;
  senderId: string;
  kind: ChatMessageKind;
  body: string;
  attachmentUrl: string | null;
  createdAt: Date;
  sender: { firstName: string | null; lastName: string | null; email: string };
};

/**
 * Newest-first rows in, chronological DTOs out.
 *
 * `fallbackSenderName` is what an account with no first/last name is shown as,
 * and it differs by surface: a jobseeker reading a company's message wants the
 * company's name, a recruiter reading a candidate's wants something that
 * identifies the person. The caller decides; the mapping does not.
 */
export function toChatMessages(
  newestFirst: RawMessage[],
  fallbackSenderName: (m: RawMessage) => string,
): { messages: ChatMessageDTO[]; truncated: boolean } {
  const { messages, truncated } = toThreadDisplay(newestFirst);
  return {
    truncated,
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName:
        [m.sender.firstName, m.sender.lastName].filter(Boolean).join(' ') || fallbackSenderName(m),
      kind: m.kind,
      body: m.body,
      attachmentUrl: m.attachmentUrl,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}
