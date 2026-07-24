'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/form';

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
      <Button type="button" onClick={() => setOpen(true)}>
        ✨ Improve my bio with AI
      </Button>
    );
  }

  return (
    <section className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-soft">
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
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
              m.role === 'user' ? 'self-end bg-neutral-900 text-white' : 'self-start bg-white text-neutral-900'
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
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything — 'make my bio more impactful'"
          className="flex-1"
        />
        <Button type="submit" disabled={status === 'streaming'}>
          Send
        </Button>
      </form>
    </section>
  );
}
