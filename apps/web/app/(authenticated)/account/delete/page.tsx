import { requireUser } from '@/lib/auth';
import { DeleteForm } from './delete-form';
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
      <div className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-4">
        <p>
          Deleting your account soft-deletes it now and permanently purges all personal data after
          30 days. Audit-log records that don&apos;t contain personal data are retained for
          legal/anti-fraud purposes.
        </p>
        <p className="font-semibold text-danger">This cannot be undone after the 30-day window.</p>
        <DeleteForm expectedConfirmation={user.email} />
      </div>
    </main>
  );
}
