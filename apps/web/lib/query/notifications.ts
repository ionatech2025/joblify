'use client';

import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './client';
import { toast } from '@/lib/stores/ui';

export type NotificationItem = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

/**
 * How often each caller polls `/api/v1/notifications`.
 *
 * Every tick is a fully authenticated request — Clerk verification plus a
 * database read — and the badge version of this hook mounts in the header
 * bell, which is on every signed-in page. A flat 30s interval there would be
 * a permanent 120-requests-an-hour poll for a number in a nav bar.
 *
 * The split is what refetchOnWindowFocus makes safe: coming back to the tab
 * refreshes immediately regardless of interval, so the badge only needs to
 * cover the case where someone sits on a page watching it. Two minutes is
 * plenty for that; the list page, where the rows themselves are on screen,
 * keeps the fast one. React Query already suspends intervals for hidden tabs.
 *
 * Each observer that passes an interval keeps its own timer. Today TanStack
 * restarts them all whenever the query updates, so the shortest one sets the
 * pace, but that is internal behaviour, not API. So `pollMs` has no default and
 * each caller states whether it is the page's poller: only the desktop header
 * bell passes `badge`, the list page passes `list`, and anything else that just
 * shows the data passes `false` and rides along.
 */
export const NOTIFICATION_POLL_MS = {
  /** Header bell — a count, not content. */
  badge: 120_000,
  /** The notifications list itself, while the user is looking at it. */
  list: 30_000,
} as const;

const notificationsQuery = (pollMs: number | false) =>
  queryOptions({
    queryKey: queryKeys.notifications(),
    queryFn: async (): Promise<NotificationItem[]> => {
      const res = await fetch('/api/v1/notifications');
      if (!res.ok)
        throw Object.assign(new Error('notifications fetch failed'), { status: res.status });
      return res.json();
    },
    refetchInterval: pollMs,
    refetchOnWindowFocus: true,
  });

export function useNotifications(pollMs: number | false) {
  return useQuery(notificationsQuery(pollMs));
}

export function unreadCount(items: readonly NotificationItem[]): number {
  return items.filter((n) => !n.readAt).length;
}

/** The same cache as useNotifications, re-rendering only when the count changes. */
export function useUnreadNotificationCount(pollMs: number | false) {
  return useQuery({ ...notificationsQuery(pollMs), select: unreadCount });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/notifications/${id}/read`, { method: 'POST' });
      if (!res.ok) throw Object.assign(new Error('mark read failed'), { status: res.status });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications() });
      const previous = queryClient.getQueryData<NotificationItem[]>(queryKeys.notifications());
      if (previous) {
        queryClient.setQueryData<NotificationItem[]>(
          queryKeys.notifications(),
          previous.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
        );
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.notifications(), ctx.previous);
      }
      // Optimistic update just silently rolled back — without this a failed
      // mark-as-read looks identical to a no-op click.
      toast.error("Couldn't mark as read", 'Try again in a moment.');
    },
    onSettled: () => {
      // Deliberately not returned (see lib/query/applications.ts).
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });
}
