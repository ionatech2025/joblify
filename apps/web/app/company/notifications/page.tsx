import { requireRole } from '@/lib/auth';
import { loadNotifications } from '@/lib/notifications/load';
import { NotificationsList } from '@/app/(authenticated)/jobseeker/notifications/notifications-list';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';

export const metadata = { title: 'Company notifications' };

export default async function CompanyNotificationsPage() {
  const user = await requireRole('COMPANY');
  const initial = await loadNotifications(user.id);

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
