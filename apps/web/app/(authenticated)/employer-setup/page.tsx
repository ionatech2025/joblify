import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { EmployerSetupForm } from './employer-setup-form';
import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'Set up your company' };

export default async function EmployerSetupPage() {
  const user = await requireUser();
  const existing = await db.companyProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) redirect('/company/jobs');

  return (
    <main>
      <PageHeader
        title="Set up your company"
        subtitle="Create your company profile to start posting jobs and reviewing applicants. You can edit any of this later in Company settings."
        width="max-w-2xl"
      />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <EmployerSetupForm />
      </div>
    </main>
  );
}
