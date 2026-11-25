import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { loadNotifications } from '@/lib/notifications/load';
import { NotificationsList } from '@/app/(authenticated)/jobseeker/notifications/notifications-list';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';

export const metadata = { title: 'Notifications' };

// Where the header bell leads. The header knows the Clerk session but not the
// account type, so the bell has one href and this page sends each role to its
// own list. A company that is not verified yet cannot open the company console
// (company/layout.tsx sends it to /employer-setup) but can already be notified
// (a rejection arrives as an ACCOUNT_UPDATE), so its list renders here instead.
export default async function NotificationsLandingPage() {
  const user = await requireUser();
  if (user.userType === 'JOB_SEEKER') redirect('/jobseeker/notifications');
  if (user.userType === 'ADMIN') redirect('/admin');

  const profile = await db.companyProfile.findUnique({
    where: { userId: user.id },
    select: { verificationStatus: true },
  });
  if (profile?.verificationStatus === 'VERIFIED') redirect('/company/notifications');

  return (
    <main>
      <ControlPanel breadcrumb={<Breadcrumb items={[{ label: 'Notifications' }]} />} />
      <ConsoleWidth className="max-w-4xl py-3">
        <p className="text-fg-muted mb-2 text-[13px]">
          Your company console opens once your profile is verified.{' '}
          <Link href="/employer-setup" className="text-brand underline">
            Go to employer setup
          </Link>
        </p>
        <NotificationsList initial={await loadNotifications(user.id)} role="COMPANY" />
      </ConsoleWidth>
    </main>
  );
}
