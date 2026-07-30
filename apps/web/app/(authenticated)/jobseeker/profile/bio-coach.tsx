'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import { MessageSquareText, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, IconButton } from '@/app/components/ui/button';
import { EmptyState } from '@/app/components/ui/empty-state';
import { Input } from '@/app/components/ui/form';

// Bio coach — streams suggestions from Sonnet via AI Gateway. Lives on the
// profile page as an "Improve my bio" assist. The current bio is sent as request
// context; the server folds it into the system prompt.
export function BioCoach({ currentBio }: { currentBio: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error, regenerate, clearError } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/v1/ai/bio-coach',
      body: { currentBio },
    }),
  });

  const streaming = status === 'streaming' || status === 'submitted';

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} icon={<Sparkles />}>
        Improve my bio with AI
      </Button>
    );
  }

  return (
    <section className="rounded-card border-border bg-brand-subtle shadow-soft mt-4 border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <strong className="text-fg">Bio coach</strong>
        <IconButton
          type="button"
          size="sm"
          variant="ghost"
          label="Close bio coach"
          onClick={() => setOpen(false)}
        >
          <X />
        </IconButton>
      </div>

      {/* aria-live so the streamed reply is announced; without it a screen
          reader user gets silence while the text fills in. */}
      <div
        aria-live="polite"
        aria-busy={streaming}
        className="mb-4 flex max-h-80 flex-col gap-2 overflow-auto"
      >
        {messages.length === 0 && !streaming ? (
          <EmptyState
            size="sm"
            icon={<MessageSquareText />}
            title="Ask for a rewrite"
            description="Describe the tone or role you're aiming for and the coach will redraft your bio."
            className="bg-surface/60 border-none"
          />
        ) : null}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              'rounded-card max-w-[85%] px-3.5 py-2 text-sm whitespace-pre-wrap',
              m.role === 'user' ? 'bg-ink text-ink-fg self-end' : 'bg-surface text-fg self-start',
            )}
          >
            {m.parts.map((part, i) =>
              part.type === 'text' ? <span key={i}>{part.text}</span> : null,
            )}
          </div>
        ))}

        {streaming ? <p className="text-fg-subtle m-0 text-sm">thinking…</p> : null}
      </div>

      {/* The route rate-limits and the Gateway can fail; without this the
          "thinking…" line just disappears and the user is left with silence. */}
      {error ? (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <p role="alert" className="text-danger m-0 text-sm">
            The coach couldn&apos;t respond. It may be busy — try again in a moment.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              clearError();
              void regenerate();
            }}
          >
            Retry
          </Button>
        </div>
      ) : null}

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
          aria-label="Ask the bio coach"
          placeholder="Ask anything — 'make my bio more impactful'"
          className="flex-1"
        />
        <Button type="submit" disabled={streaming || !input.trim()}>
          Send
        </Button>
      </form>
    </section>
  );
}
