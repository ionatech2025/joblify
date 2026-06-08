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
        style={{ padding: '0.6rem 1rem', background: '#1856a8', color: 'white', borderRadius: 6, border: 0, cursor: 'pointer', fontWeight: 600 }}
      >
        ✨ Improve my bio with AI
      </button>
    );
  }

  return (
    <section
      style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #d0d7e0', borderRadius: 8, background: '#fafbff' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <strong>Bio coach</strong>
        <button onClick={() => setOpen(false)} aria-label="Close bio coach" style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>
          ✕
        </button>
      </div>

      <div style={{ maxHeight: 320, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              padding: '0.5rem 0.75rem',
              background: m.role === 'user' ? '#e7f0ff' : '#fff',
              border: '1px solid #e1e4e8',
              borderRadius: 6,
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              whiteSpace: 'pre-wrap',
            }}
          >
            {m.parts.map((part, i) => (part.type === 'text' ? <span key={i}>{part.text}</span> : null))}
          </div>
        ))}
        {status === 'streaming' && <p style={{ color: '#888', fontSize: '0.85rem' }}>thinking…</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          void sendMessage({ text: input });
          setInput('');
        }}
        style={{ display: 'flex', gap: '0.5rem' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything — 'make my bio more impactful'"
          style={{ flex: 1, padding: '0.6rem', border: '1px solid #ccc', borderRadius: 6 }}
        />
        <button
          type="submit"
          disabled={status === 'streaming'}
          style={{ padding: '0.6rem 1rem', background: '#111', color: 'white', borderRadius: 6, border: 0, cursor: 'pointer' }}
        >
          Send
        </button>
      </form>
    </section>
  );
}
