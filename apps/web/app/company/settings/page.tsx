import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { CompanySettingsForm } from './company-settings-form';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';

export const metadata = { title: 'Company settings' };

export default async function CompanySettingsPage() {
  const user = await requireRole('COMPANY');
  const profile = await db.companyProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect('/employer-setup');

  return (
    <main>
      <ControlPanel breadcrumb={<Breadcrumb items={[{ label: 'Settings' }]} />} />
      <ConsoleWidth className="max-w-5xl py-3">
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
      </ConsoleWidth>
    </main>
  );
}
