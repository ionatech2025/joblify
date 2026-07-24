import type { ChatMessageKind } from '@prisma/client';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';

export type ChatThreadMessage = {
  id: string;
  senderId: string;
  senderName: string;
  kind: ChatMessageKind;
  body: string;
  attachmentUrl: string | null;
  createdAt: Date;
};

const KIND_BADGE: Partial<Record<ChatMessageKind, { label: string; tone: 'warn' | 'success' }>> = {
  MATERIAL: { label: 'Material', tone: 'warn' },
  INTERVIEW_DETAILS: { label: 'Interview details', tone: 'success' },
};

// Presentational thread. The page decides access and supplies the messages
// (oldest first); own messages align right as ink bubbles, everyone else's
// sit left on neutral. The whole conversation floats on a Card surface.
export function ChatThread({ messages, currentUserId }: { messages: ChatThreadMessage[]; currentUserId: string }) {
  if (messages.length === 0) {
    return (
      <Card>
        <p className="m-0 text-neutral-600">No messages yet — start the conversation below.</p>
      </Card>
    );
  }

  return (
    <Card>
      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0">
        {messages.map((m) => {
          const own = m.senderId === currentUserId;
          const badge = KIND_BADGE[m.kind];
          return (
            <li key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${
                  own ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-900'
                }`}
              >
                <p className={`m-0 text-xs font-medium ${own ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  {own ? 'You' : m.senderName}
                  {badge && (
                    <Badge tone={badge.tone} className="ml-2">
                      {badge.label}
                    </Badge>
                  )}
                </p>
                <p className={`mt-1 mb-0 text-sm whitespace-pre-wrap ${own ? 'text-white' : 'text-neutral-900'}`}>
                  {m.body}
                </p>
                {m.attachmentUrl && (
                  <a
                    href={m.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-1 inline-block text-sm hover:underline ${
                      own ? 'text-indigo-300' : 'text-indigo-700'
                    }`}
                  >
                    View attachment ↗
                  </a>
                )}
                <p className="mt-1 mb-0 text-xs text-neutral-400">{m.createdAt.toLocaleString()}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
