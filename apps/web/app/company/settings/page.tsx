import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { CompanySettingsForm } from './company-settings-form';
import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'Company settings' };

export default async function CompanySettingsPage() {
  const user = await requireRole('COMPANY');
  const profile = await db.companyProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect('/employer-setup');

  return (
    <main>
      <PageHeader
        title="Company settings"
        subtitle="This is what jobseekers see on your company page and job posts."
        width="max-w-2xl"
      />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <CompanySettingsForm
          userId={user.id}
          logoUrl={profile.logoUrl ?? null}
          initial={{
            companyName: profile.companyName,
            industry: profile.industry,
            companySize: profile.companySize,
            description: profile.description,
            website: profile.website ?? '',
            linkedin: profile.linkedin ?? '',
          }}
        />
      </div>
    </main>
  );
}
