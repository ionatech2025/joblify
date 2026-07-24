import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'Privacy policy' };

export default function PrivacyPage() {
  return (
    <main>
      <PageHeader eyebrow="Legal" title="Privacy policy" width="max-w-3xl" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p>
        Joblify processes personal data to operate the job marketplace and only for the purposes
        listed below. We act as a controller for jobseeker accounts and a processor when companies
        receive applications.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Identity: email, name, phone (optional), avatar.</li>
        <li>Profile: headline, bio, skills, experience, location, salary expectations.</li>
        <li>Applications: resumes, cover letters, status history.</li>
        <li>Usage: IP address, session metadata, audit-log entries.</li>
        <li>Cookies: essential session cookies; analytics with your consent.</li>
      </ul>

      <h2>Why we collect it</h2>
      <ul>
        <li>Provide the service (contract).</li>
        <li>Anti-fraud, security, abuse prevention (legitimate interest).</li>
        <li>Email notifications you&apos;ve opted into (consent).</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        Under GDPR and CCPA you can request a copy of your data (
        <a href="/account/export">/account/export</a>) or delete your account (
        <a href="/account/delete">/account/delete</a>). We honor these within 30 days; deletion is
        soft for 30 days, then permanent.
      </p>

      <h2>Who we share with</h2>
      <p>
        Application data goes to the company you applied to. Operational processors (
        <a href="/legal/processors">listed here</a>) handle hosting, search, email, and
        observability; each is bound by a DPA.
      </p>

      <h2>Retention</h2>
      <ul>
        <li>Active accounts: kept while the account is active.</li>
        <li>Soft-deleted accounts: 30 days, then purged.</li>
        <li>Audit-log entries: 1 year, then purged.</li>
        <li>Job view analytics: 13 months, then purged.</li>
      </ul>

      <p className="text-neutral-500">
        Contact: <a href="mailto:privacy@joblify.example">privacy@joblify.example</a>
      </p>
      </div>
    </main>
  );
}
