import { requireUser } from '@/lib/auth';
import { ExportButton } from './export-button';
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
      <div className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-4">
        <p>
          We&apos;ll bundle every record tied to your account — profile, work history, applications,
          résumés, saved jobs and searches, messages you sent, notifications and audit log entries —
          as a JSON file that downloads straight to your device. Nothing is stored or emailed, so
          there is no link to expire or to leak.
        </p>
        <p className="text-sm text-fg-subtle">
          This is your GDPR Article 15 right. You can run it twice per day.
        </p>
        <ExportButton />
      </div>
    </main>
  );
}
