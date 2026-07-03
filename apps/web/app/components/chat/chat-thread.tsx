import type { ChatMessageKind } from '@prisma/client';

export type ChatThreadMessage = {
  id: string;
  senderId: string;
  senderName: string;
  kind: ChatMessageKind;
  body: string;
  attachmentUrl: string | null;
  createdAt: Date;
};

const KIND_BADGE: Partial<Record<ChatMessageKind, { label: string; className: string }>> = {
  MATERIAL: { label: 'Material', className: 'bg-amber-50 text-amber-800' },
  INTERVIEW_DETAILS: { label: 'Interview details', className: 'bg-emerald-50 text-emerald-800' },
};

// Presentational thread. The page decides access and supplies the messages
// (oldest first); own messages align right.
export function ChatThread({ messages, currentUserId }: { messages: ChatThreadMessage[]; currentUserId: string }) {
  if (messages.length === 0) {
    return <p className="text-neutral-600">No messages yet — start the conversation below.</p>;
  }

  return (
    <ul className="grid list-none grid-cols-1 gap-3 p-0">
      {messages.map((m) => {
        const own = m.senderId === currentUserId;
        const badge = KIND_BADGE[m.kind];
        return (
          <li key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl border px-4 py-2.5 sm:max-w-[70%] ${
                own ? 'border-indigo-100 bg-indigo-50/60' : 'border-neutral-200 bg-white'
              }`}
            >
              <p className="m-0 text-xs font-medium text-neutral-500">
                {own ? 'You' : m.senderName}
                {badge && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </p>
              <p className="mt-1 mb-0 text-sm whitespace-pre-wrap text-neutral-900">{m.body}</p>
              {m.attachmentUrl && (
                <a
                  href={m.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm text-indigo-700 hover:underline"
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
  );
}
