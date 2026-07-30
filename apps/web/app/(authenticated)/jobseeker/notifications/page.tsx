import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { NotificationsList } from './notifications-list';
import type { NotificationItem } from '@/lib/query/notifications';
import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await requireRole('JOB_SEEKER');
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
    <main>
      <PageHeader title="Notifications" width="max-w-3xl" />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <NotificationsList initial={initial} />
      </div>
    </main>
  );
}
