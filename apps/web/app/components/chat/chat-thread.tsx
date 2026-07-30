import type { ChatMessageKind } from '@prisma/client';
import { ExternalLink, MessageSquare } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { EmptyState } from '@/app/components/ui/empty-state';
import { Card } from '@/app/components/ui/card';
import { CHAT_KIND_BADGE } from '@/lib/ui/status';

export type ChatThreadMessage = {
  id: string;
  senderId: string;
  senderName: string;
  kind: ChatMessageKind;
  body: string;
  attachmentUrl: string | null;
  createdAt: Date;
};

// Presentational thread. The page decides access and supplies the messages
// (oldest first); own messages align right as ink bubbles, everyone else's
// sit left on neutral. The whole conversation floats on a Card surface.
export function ChatThread({
  messages,
  currentUserId,
}: {
  messages: ChatThreadMessage[];
  currentUserId: string;
}) {
  if (messages.length === 0) {
    return (
      <Card>
        <EmptyState
          size="sm"
          icon={<MessageSquare />}
          title="No messages yet"
          description="Start the conversation using the composer below."
          className="border-0 bg-transparent"
        />
      </Card>
    );
  }

  return (
    <Card>
      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0">
        {messages.map((m) => {
          const own = m.senderId === currentUserId;
          const badge = CHAT_KIND_BADGE[m.kind];
          return (
            <li key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-card px-4 py-2.5 sm:max-w-[70%] ${
                  own ? 'bg-ink text-ink-fg' : 'bg-surface-sunken text-fg'
                }`}
              >
                <p
                  className={`m-0 text-xs font-medium ${own ? 'text-ink-fg/70' : 'text-fg-subtle'}`}
                >
                  {own ? 'You' : m.senderName}
                  {badge && (
                    <Badge tone={badge.tone} className="ml-2">
                      {badge.label}
                    </Badge>
                  )}
                </p>
                <p
                  className={`mt-1 mb-0 text-sm whitespace-pre-wrap ${own ? 'text-ink-fg' : 'text-fg'}`}
                >
                  {m.body}
                </p>
                {m.attachmentUrl && (
                  <a
                    href={m.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-1 inline-flex items-center gap-1 text-sm hover:underline ${
                      own ? 'text-ink-fg/80' : 'text-brand'
                    }`}
                  >
                    View attachment
                    <ExternalLink aria-hidden className="size-3.5" />
                  </a>
                )}
                <p className="mt-1 mb-0 text-xs text-fg-subtle">{m.createdAt.toLocaleString()}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
