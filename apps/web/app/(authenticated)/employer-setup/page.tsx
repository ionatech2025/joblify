import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { EmployerSetupForm } from './employer-setup-form';

export const metadata = { title: 'Set up your company' };

export default async function EmployerSetupPage() {
  const user = await requireUser();
  const existing = await db.companyProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) redirect('/company/jobs');

  return (
    <main style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
      <h1>Set up your company</h1>
      <p style={{ color: '#666' }}>
        Create your company profile to start posting jobs and reviewing applicants. You can edit any
        of this later in Company settings.
      </p>
      <EmployerSetupForm />
    </main>
  );
}
