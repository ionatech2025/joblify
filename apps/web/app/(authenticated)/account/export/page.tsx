import { requireUser } from '@/lib/auth';
import { ExportButton } from './export-button';
import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'Export my data' };

export default async function ExportPage() {
  await requireUser();

  return (
    <main>
      <PageHeader title="Export my data" width="max-w-2xl" />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <p>
        We&apos;ll bundle every row tied to your account — profile, applications, resumes,
        notifications, audit log entries — as a JSON file and email you a signed download link valid
        for 24 hours.
      </p>
      <p className="text-sm text-neutral-500">This is your GDPR Article 15 right. You can run it twice per day.</p>
      <ExportButton />
      </div>
    </main>
  );
}
