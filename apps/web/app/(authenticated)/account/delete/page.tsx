import { requireUser } from '@/lib/auth';
import { DeleteForm } from './delete-form';

export const metadata = { title: 'Delete my account' };

export default async function DeleteAccountPage() {
  const user = await requireUser();
  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>Delete my account</h1>
      <p>
        Deleting your account soft-deletes it now and permanently purges all personal data after 30
        days. Audit-log records that don't contain personal data are retained for legal/anti-fraud
        purposes.
      </p>
      <p style={{ color: '#a00', fontWeight: 600 }}>This cannot be undone after the 30-day window.</p>
      <DeleteForm expectedConfirmation={user.email} />
    </main>
  );
}
