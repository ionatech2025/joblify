// @vitest-environment jsdom

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { Component, type ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatComposer } from '@/app/components/chat/chat-composer';
import { ChatThread } from '@/app/components/chat/chat-thread';
import { ChatThreadLive } from '@/app/components/chat/chat-thread-live';
import { CHAT_MAX_BACKOFF_MS, CHAT_POLL_MS, chatPollDelay } from '@/lib/query/chat';
import type { ChatMessageDTO } from '@/app/components/chat/latest-messages';

const send = vi.hoisted(() => vi.fn());
vi.mock('@/app/actions/chat', () => ({ sendChatMessage: send }));

function withQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

class Boundary extends Component<{ children: ReactNode }, { caught: boolean }> {
  state = { caught: false };
  static getDerivedStateFromError() {
    return { caught: true };
  }
  render() {
    return this.state.caught ? <p>boundary caught</p> : this.props.children;
  }
}

const message: ChatMessageDTO = {
  id: 'm1',
  senderId: 'company_1',
  senderName: 'Acme',
  kind: 'TEXT',
  body: 'Welcome to the chat.',
  attachmentUrl: null,
  createdAt: '2026-10-01T09:00:00.000Z',
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {})),
  );
});

afterEach(() => {
  cleanup();
  send.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ChatThread', () => {
  it('is a named log region, so polled-in messages are announced', () => {
    render(<ChatThread currentUserId="seeker_1" messages={[message]} />);
    const log = screen.getByRole('log', { name: 'Messages' });
    expect(log.textContent).toContain('Welcome to the chat.');
  });

  it('keeps the log region when empty, so the first message is announced too', () => {
    render(<ChatThread currentUserId="seeker_1" messages={[]} />);
    expect(screen.getByRole('log', { name: 'Messages' }).textContent).toContain('No messages yet');
  });
});

describe('ChatComposer', () => {
  it('turns a thrown send into an inline error and keeps the typed message', async () => {
    send.mockRejectedValue(new Error('fetch failed'));
    render(withQuery(<ChatComposer chatAreaId="area_1" />));
    const body = screen.getByRole('textbox', { name: /message/i });
    await userEvent.type(body, 'Is the interview still on Friday?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/wasn.t sent/);
    expect((body as HTMLTextAreaElement).value).toBe('Is the interview still on Friday?');
  });

  it('still lets a sign-in redirect through instead of swallowing it', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    send.mockRejectedValue(
      Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT;push;/sign-in;307;' }),
    );
    render(
      withQuery(
        <Boundary>
          <ChatComposer chatAreaId="area_1" />
        </Boundary>,
      ),
    );
    await userEvent.type(screen.getByRole('textbox', { name: /message/i }), 'hello');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('boundary caught')).toBeDefined();
  });
});

describe('chatPollDelay', () => {
  const now = 1_000_000_000;
  const failing = (status: number, sinceLastGood: number) => ({
    status: 'error',
    error: { status },
    dataUpdatedAt: now - sinceLastGood,
  });

  it('polls at the normal rate while healthy', () => {
    expect(chatPollDelay({ status: 'success', error: null, dataUpdatedAt: now }, now)).toBe(
      CHAT_POLL_MS,
    );
  });

  it('backs off while failing, up to a cap', () => {
    expect(chatPollDelay(failing(500, 5_000), now)).toBe(CHAT_POLL_MS);
    expect(chatPollDelay(failing(500, 40_000), now)).toBe(40_000);
    expect(chatPollDelay(failing(500, 60 * 60_000), now)).toBe(CHAT_MAX_BACKOFF_MS);
  });

  it('stops polling once access to the chat is gone', () => {
    expect(chatPollDelay(failing(404, 10_000), now)).toBe(false);
  });

  it('keeps retrying a 401, which an expired session token also produces', () => {
    expect(chatPollDelay(failing(401, 20_000), now)).toBe(20_000);
  });
});

describe('ChatThreadLive', () => {
  const initial = { messages: [message], truncated: false };

  it('says so when it lost access, and keeps the messages it has', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 404 })),
    );
    render(withQuery(<ChatThreadLive chatAreaId="area_1" currentUserId="u1" initial={initial} />));
    await screen.findByText('You no longer have access to this chat.');
    expect(screen.getByRole('status').textContent).toBe('You no longer have access to this chat.');
    expect(screen.getByText('Welcome to the chat.')).toBeDefined();
  });

  it('says it is retrying when a refresh fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 500 })),
    );
    render(withQuery(<ChatThreadLive chatAreaId="area_1" currentUserId="u1" initial={initial} />));
    await screen.findByText(/Couldn.t refresh messages\. Retrying…/);
    expect(screen.getByRole('status').textContent).toMatch(/Retrying/);
  });

  it('shows nothing while refreshes succeed', () => {
    render(withQuery(<ChatThreadLive chatAreaId="area_1" currentUserId="u1" initial={initial} />));
    expect(screen.getByRole('status').textContent).toBe('');
  });
});
