'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
 * database read — and the badge version of this hook mounts in the jobseeker
 * module nav, which is on every /jobseeker/* page. Onboarding redirects
 * straight into it, so a single flat 30s interval meant every newly onboarded
 * user opened a permanent 120-requests-an-hour poll for a number in a nav bar.
 *
 * The split is what refetchOnWindowFocus makes safe: coming back to the tab
 * refreshes immediately regardless of interval, so the badge only needs to
 * cover the case where someone sits on a page watching it. Two minutes is
 * plenty for that; the list page, where the rows themselves are on screen,
 * keeps the fast one. React Query already suspends intervals for hidden tabs.
 */
export const NOTIFICATION_POLL_MS = {
  /** Nav badge — a count, not content. */
  badge: 120_000,
  /** The notifications list itself, while the user is looking at it. */
  list: 30_000,
} as const;

// Week 9 wires the matching `/api/v1/notifications` Route Handler. Until then
// this hook is safe to call — it'll just surface a 501 and the UI shows an
// empty state.
export function useNotifications(pollMs: number = NOTIFICATION_POLL_MS.badge) {
  return useQuery({
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
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });
}
