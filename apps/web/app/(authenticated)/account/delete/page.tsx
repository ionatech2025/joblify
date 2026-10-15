import { requireUser } from '@/lib/auth';
import { DeleteForm } from './delete-form';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';

export const metadata = { title: 'Delete my account' };

export default async function DeleteAccountPage() {
  const user = await requireUser();
  return (
    <main>
      <ControlPanel
        breadcrumb={
          <Breadcrumb
            items={[{ label: 'Account', href: '/dashboard' }, { label: 'Delete account' }]}
          />
        }
      />
      <ConsoleWidth className="max-w-3xl py-3">
        <p>
          Deleting your account soft-deletes it now and permanently purges all personal data after
          30 days. Audit-log records that don&apos;t contain personal data are retained for
          legal/anti-fraud purposes.
        </p>
        <p className="mt-2 font-semibold text-danger">
          This cannot be undone after the 30-day window.
        </p>
        <DeleteForm expectedConfirmation={user.email} />
      </ConsoleWidth>
    </main>
  );
}
