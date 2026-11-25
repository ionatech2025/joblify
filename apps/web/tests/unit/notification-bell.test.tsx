// @vitest-environment jsdom

import { describe, it, expect, afterEach, onTestFinished, vi } from 'vitest';
import type { ReactNode } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { NotificationBell } from '@/app/components/notification-bell';
import { NotificationsList } from '@/app/(authenticated)/jobseeker/notifications/notifications-list';
import { NOTIFICATION_POLL_MS, type NotificationItem } from '@/lib/query/notifications';

function notifications(unread: number, read = 0): NotificationItem[] {
  return Array.from({ length: unread + read }, (_, i) => ({
    id: `n${i}`,
    kind: 'SYSTEM',
    payload: {},
    readAt: i < unread ? null : '2026-11-20T00:00:00.000Z',
    createdAt: new Date(Date.UTC(2026, 10, 25) - i * 60_000).toISOString(),
  }));
}

function serve(respond: () => Response | Promise<Response>) {
  const fetchMock = vi.fn(async () => respond());
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// The app's default staleTime (lib/query/client.ts), so a late mount reads the
// cache instead of refetching.
function renderWithClient(
  ui: ReactNode,
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } }),
) {
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return client;
}

const settled = (client: QueryClient) =>
  waitFor(() => {
    const state = client.getQueryState(['notifications']);
    expect(state?.status).not.toBe('pending');
    expect(state?.fetchStatus).toBe('idle');
  });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('NotificationBell', () => {
  it('names the unread count and opens the notifications landing', async () => {
    serve(() => Response.json(notifications(3, 2)));
    renderWithClient(<NotificationBell />);
    const bell = await screen.findByRole('link', { name: 'Notifications, 3 unread' });
    expect(bell.getAttribute('href')).toBe('/dashboard/notifications');
    expect(bell.textContent).toBe('3');
  });

  it('caps the badge at 9+ but names the exact count', async () => {
    serve(() => Response.json(notifications(12)));
    renderWithClient(<NotificationBell />);
    const bell = await screen.findByRole('link', { name: 'Notifications, 12 unread' });
    expect(bell.textContent).toBe('9+');
  });

  it('says "or more" once every row it can see is unread', async () => {
    serve(() => Response.json(notifications(50)));
    renderWithClient(<NotificationBell />);
    expect(
      await screen.findByRole('link', { name: 'Notifications, 50 or more unread' }),
    ).toBeTruthy();
  });

  it.each([
    ['nothing is unread', () => Response.json(notifications(0, 4))],
    ['the request fails', () => new Response(null, { status: 500 })],
  ])('shows no badge when %s', async (_, respond) => {
    serve(respond);
    const client = renderWithClient(<NotificationBell />);
    await settled(client);
    const bell = screen.getByRole('link', { name: 'Notifications' });
    expect(bell.textContent).toBe('');
  });

  it('shows no badge while the count is loading', () => {
    serve(() => new Promise<never>(() => {}));
    renderWithClient(<NotificationBell />);
    expect(screen.getByRole('link', { name: 'Notifications' }).textContent).toBe('');
  });

  it('polls once per interval with a desktop and a mobile bell mounted', async () => {
    vi.useFakeTimers();
    const fetchMock = serve(() => Response.json(notifications(1)));
    // The two header islands stream in separately.
    const client = renderWithClient(<NotificationBell poll />);
    await vi.advanceTimersByTimeAsync(1_000);
    renderWithClient(<NotificationBell />, client);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(NOTIFICATION_POLL_MS.badge);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('drops the count as soon as a row is opened, before the server answers', async () => {
    const items = notifications(3, 2).map((n) => ({
      ...n,
      kind: 'APPLICATION_STATUS_CHANGED' as const,
    }));
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) =>
        init?.method === 'POST' ? new Promise<never>(() => {}) : Response.json(items),
      ),
    );
    // jsdom cannot follow a link to another document; the test only needs the click.
    const stayOnPage = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('click', stayOnPage);
    onTestFinished(() => document.removeEventListener('click', stayOnPage));
    renderWithClient(
      <>
        <NotificationBell poll />
        <NotificationsList initial={items} />
      </>,
    );
    await screen.findByRole('link', { name: 'Notifications, 3 unread' });

    await userEvent.click(
      screen.getAllByRole('link', { name: /^Unread:\s?Application update$/ })[0]!,
    );
    expect(await screen.findByRole('link', { name: 'Notifications, 2 unread' })).toBeTruthy();
  });
});
