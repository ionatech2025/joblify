import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NotificationsList } from './notifications-list';
import type { NotificationItem } from '@/lib/query/notifications';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await requireUser();
  const rows = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const initial: NotificationItem[] = rows.map((n) => ({
    id: n.id,
    kind: n.kind,
    payload: n.payload as Record<string, unknown>,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-4 text-2xl font-bold text-neutral-900">Notifications</h1>
      <NotificationsList initial={initial} />
    </main>
  );
}
