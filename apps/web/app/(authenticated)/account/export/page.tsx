import { requireUser } from '@/lib/auth';
import { ExportButton } from './export-button';

export const metadata = { title: 'Export my data' };

export default async function ExportPage() {
  await requireUser();

  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>Export my data</h1>
      <p>
        We'll bundle every row tied to your account — profile, applications, resumes, notifications, audit
        log entries — as a JSON file and email you a signed download link valid for 24 hours.
      </p>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        This is your GDPR Article 15 right. You can run it twice per day.
      </p>
      <ExportButton />
    </main>
  );
}
