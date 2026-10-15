import { requireUser } from '@/lib/auth';
import { ExportButton } from './export-button';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';

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
      />
      <ConsoleWidth className="max-w-3xl py-3">
        <p>
          We&apos;ll bundle every record tied to your account — profile, work history, applications,
          résumés, saved jobs and searches, messages you sent, notifications and audit log entries —
          as a JSON file that downloads straight to your device. Nothing is stored or emailed, so
          there is no link to expire or to leak.
        </p>
        <p className="mt-2 text-sm text-fg-subtle">
          This is your GDPR Article 15 right. You can run it twice per day.
        </p>
        <ExportButton />
      </ConsoleWidth>
    </main>
  );
}
