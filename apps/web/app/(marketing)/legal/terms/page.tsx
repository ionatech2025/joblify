import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'Terms of service' };

export default function TermsPage() {
  return (
    <main>
      <PageHeader eyebrow="Legal" title="Terms of service" width="max-w-3xl" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p>
        By using Joblify you agree to use the platform lawfully, not impersonate others, and respect
        the access controls on the service. Job postings must be genuine and lawful. Applications
        must be made in good faith.
      </p>
      <h2>Acceptable use</h2>
      <ul>
        <li>No discrimination in job postings.</li>
        <li>No scraping or automated harvesting of jobseeker data.</li>
        <li>No fee-charging on jobseekers; the service is free for them.</li>
      </ul>
      <h2>Termination</h2>
      <p>
        We can suspend or terminate accounts that violate these terms. Soft-deleted accounts are
        purged after 30 days as described in the privacy policy.
      </p>
      <p className="text-neutral-500">
        Contact: <a href="mailto:legal@joblify.example">legal@joblify.example</a>
      </p>
      </div>
    </main>
  );
}
