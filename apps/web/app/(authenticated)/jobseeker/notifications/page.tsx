import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { NotificationsList } from './notifications-list';
import type { NotificationItem } from '@/lib/query/notifications';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';

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
      <ControlPanel breadcrumb={<Breadcrumb items={[{ label: 'Notifications' }]} />} />
      <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-4">
        <NotificationsList initial={initial} />
      </div>
    </main>
  );
}
