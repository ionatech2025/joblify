import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { NotificationsList } from '@/app/(authenticated)/jobseeker/notifications/notifications-list';
import type { NotificationItem } from '@/lib/query/notifications';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';

export const metadata = { title: 'Company notifications' };

export default async function CompanyNotificationsPage() {
  const user = await requireRole('COMPANY');
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
      <ConsoleWidth className="max-w-4xl py-3">
        <p className="text-fg-muted mb-2 text-[13px]">
          New applicants, subscriber activity, invitation responses, and moderation updates.
        </p>
        <NotificationsList initial={initial} role="COMPANY" />
      </ConsoleWidth>
    </main>
  );
}
