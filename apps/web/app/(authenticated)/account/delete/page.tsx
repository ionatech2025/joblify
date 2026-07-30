import { requireUser } from '@/lib/auth';
import { DeleteForm } from './delete-form';
import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'Delete my account' };

export default async function DeleteAccountPage() {
  const user = await requireUser();
  return (
    <main>
      <PageHeader title="Delete my account" width="max-w-2xl" />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
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
