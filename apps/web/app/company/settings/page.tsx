import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { CompanySettingsForm } from './company-settings-form';

export const metadata = { title: 'Company settings' };

export default async function CompanySettingsPage() {
  const user = await requireRole('COMPANY');
  const profile = await db.companyProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect('/employer-setup');

  return (
    <main style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
      <h1>Company settings</h1>
      <p style={{ color: '#666' }}>
        This is what jobseekers see on your company page and job posts.
      </p>
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
    </main>
  );
}
