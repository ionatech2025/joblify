import { requireRole } from '@/lib/auth';
import { loadNotifications } from '@/lib/notifications/load';
import { NotificationsList } from './notifications-list';
import { DigestPreference } from './digest-preference';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await requireRole('JOB_SEEKER');
  const initial = await loadNotifications(user.id);

  return (
    <main>
      <ControlPanel breadcrumb={<Breadcrumb items={[{ label: 'Notifications' }]} />} />
      <ConsoleWidth className="max-w-4xl py-3">
        <DigestPreference
          initialOptIn={user.digestOptIn}
          addressSuppressed={user.emailSuppressedAt !== null}
        />
        <NotificationsList initial={initial} />
      </ConsoleWidth>
    </main>
  );
}
