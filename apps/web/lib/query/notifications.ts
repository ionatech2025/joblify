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

// Polls the in-app notifications list every 30s. Week 9 wires the matching
// `/api/v1/notifications` Route Handler. Until then this hook is safe to call
// — it'll just surface a 501 and the UI shows an empty state.

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: async (): Promise<NotificationItem[]> => {
      const res = await fetch('/api/v1/notifications');
      if (!res.ok)
        throw Object.assign(new Error('notifications fetch failed'), { status: res.status });
      return res.json();
    },
    refetchInterval: 30_000,
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
