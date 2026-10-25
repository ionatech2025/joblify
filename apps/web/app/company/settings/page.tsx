import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { CompanySettingsForm } from './company-settings-form';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { buttonClasses } from '@/app/components/ui/button';

export const metadata = { title: 'Company settings' };

export default async function CompanySettingsPage() {
  const user = await requireRole('COMPANY');
  const profile = await db.companyProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect('/employer-setup');

  return (
    <main>
      <ControlPanel
        breadcrumb={<Breadcrumb items={[{ label: 'Settings' }]} />}
        actions={
          <Link
            href={`/companies/${profile.slug}`}
            className={`${buttonClasses('ghost', 'sm')} no-underline`}
          >
            View public profile
          </Link>
        }
      />
      <ConsoleWidth className="max-w-5xl py-3">
        <CompanySettingsForm
          logoUrl={profile.logoUrl ?? null}
          initial={{
            companyName: profile.companyName,
            industry: profile.industry,
            companySize: profile.companySize,
            description: profile.description,
            address: profile.address ?? '',
            phone: user.phone ?? '',
            contactPersonName: profile.contactPersonName ?? '',
            contactPersonPosition: profile.contactPersonPosition ?? '',
            website: profile.website ?? '',
            linkedin: profile.linkedin ?? '',
          }}
        />

        <section
          aria-label="Account and data privacy"
          className="o-sheet mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"
        >
          <div className="min-w-0">
            <h2 className="text-fg text-[13px] font-semibold">Data &amp; account privacy</h2>
            <p className="text-fg-muted text-[12px]">
              Download your organization&apos;s account archive (GDPR Article 15) or close this
              employer account.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/account/export"
              className={`${buttonClasses('secondary', 'sm')} no-underline`}
            >
              Export data
            </Link>
            <Link
              href="/account/delete"
              className={`${buttonClasses('danger', 'sm')} no-underline`}
            >
              Delete account
            </Link>
          </div>
        </section>
      </ConsoleWidth>
    </main>
  );
}
