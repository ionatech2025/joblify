'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

// Bio coach — streams suggestions from Sonnet via AI Gateway. Lives on the
// profile page as an "Improve my bio" assist. The current bio is sent as request
// context; the server folds it into the system prompt.
export function BioCoach({ currentBio }: { currentBio: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/v1/ai/bio-coach',
      body: { currentBio },
    }),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        ✨ Improve my bio with AI
      </button>
    );
  }

  return (
    <section className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
      <div className="mb-2 flex justify-between">
        <strong>Bio coach</strong>
        <button onClick={() => setOpen(false)} aria-label="Close bio coach" className="cursor-pointer border-0 bg-transparent">
          ✕
        </button>
      </div>

      <div className="mb-4 flex max-h-80 flex-col gap-2 overflow-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] whitespace-pre-wrap rounded-md border border-neutral-200 px-3 py-2 ${
              m.role === 'user' ? 'self-end bg-blue-50' : 'self-start bg-white'
            }`}
          >
            {m.parts.map((part, i) => (part.type === 'text' ? <span key={i}>{part.text}</span> : null))}
          </div>
        ))}
        {status === 'streaming' && <p className="text-sm text-neutral-500">thinking…</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          void sendMessage({ text: input });
          setInput('');
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything — 'make my bio more impactful'"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={status === 'streaming'}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
