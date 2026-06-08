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
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-neutral-900">Set up your company</h1>
      <p className="mt-1 text-neutral-600">
        Create your company profile to start posting jobs and reviewing applicants. You can edit any
        of this later in Company settings.
      </p>
      <EmployerSetupForm />
    </main>
  );
}
