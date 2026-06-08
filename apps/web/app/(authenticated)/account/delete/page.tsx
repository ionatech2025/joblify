import { requireUser } from '@/lib/auth';
import { DeleteForm } from './delete-form';

export const metadata = { title: 'Delete my account' };

export default async function DeleteAccountPage() {
  const user = await requireUser();
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-neutral-900">Delete my account</h1>
      <p>
        Deleting your account soft-deletes it now and permanently purges all personal data after 30
        days. Audit-log records that don&apos;t contain personal data are retained for
        legal/anti-fraud purposes.
      </p>
      <p className="font-semibold text-red-700">This cannot be undone after the 30-day window.</p>
      <DeleteForm expectedConfirmation={user.email} />
    </main>
  );
}
