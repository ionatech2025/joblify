import { db } from '@/lib/db';
import { NOTIFICATIONS_PAGE_CAP } from '@/lib/query/client';
import type { NotificationItem } from '@/lib/query/notifications';

export async function loadNotifications(userId: string): Promise<NotificationItem[]> {
  const rows = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: NOTIFICATIONS_PAGE_CAP,
  });
  return rows.map((n) => ({
    id: n.id,
    kind: n.kind,
    payload: n.payload as Record<string, unknown>,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));
}
