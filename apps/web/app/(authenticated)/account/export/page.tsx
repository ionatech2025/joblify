import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { ExportButton } from './export-button';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { FormSheet, SheetTitle } from '@/app/components/console/sheet';
import { buttonClasses } from '@/app/components/ui/button';

export const metadata = { title: 'Export my data' };

export default async function ExportPage() {
  await requireUser();

  return (
    <main>
      <ControlPanel
        breadcrumb={
          <Breadcrumb
            items={[{ label: 'Account', href: '/dashboard' }, { label: 'Export data' }]}
          />
        }
        actions={
          <Link href="/account/delete" className={`${buttonClasses('ghost', 'sm')} no-underline`}>
            Delete account
          </Link>
        }
      />
      <ConsoleWidth className="max-w-3xl py-3">
        <FormSheet>
          <SheetTitle
            title="Export your personal data"
            subtitle="Download a complete, machine-readable archive of your account records (GDPR Article 15)."
          />
          <p className="text-fg text-[13px] leading-relaxed">
            We&apos;ll bundle every record tied to your account — profile, work history,
            applications, résumés, saved jobs and searches, messages you sent, notifications and
            audit log entries — as a JSON file that downloads straight to your device. Nothing is
            stored or emailed, so there is no link to expire or to leak.
          </p>
          <p className="text-fg-subtle mt-2 text-[12px]">
            This is your GDPR Article 15 right. You can run it twice per day.
          </p>
          <ExportButton />
        </FormSheet>
      </ConsoleWidth>
    </main>
  );
}
