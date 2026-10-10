import { PageHeader } from '@/app/components/ui/ambient';
import { CONTACTS, CONTROLLER } from '@/lib/site-config';

export const metadata = { title: 'Privacy policy' };

// Keep in step with the code. Several statements below are enforced by a named
// job or setting — the file noted beside each is where to look before changing
// the sentence (workflows/retention.workflow.ts, app/api/v1/account/export,
// app/actions/email-preferences.ts, lib/ai/*).
//
// REVIEW WITH COUNSEL before launch: the transfer-safeguard sentence, the
// controller/joint-controller description for employers, and the supervisory
// authority wording are legal characterisations this file cannot verify.
const LAST_UPDATED = '2026-10-10';

export default function PrivacyPage() {
  return (
    <main>
      <PageHeader eyebrow="Legal" title="Privacy policy" width="max-w-3xl" />
      <div className="prose-links mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-fg-subtle text-sm">Last updated {LAST_UPDATED}.</p>

        <p>
          <strong>{CONTROLLER.name}</strong>
          {CONTROLLER.address ? <> ({CONTROLLER.address})</> : null} is the controller of the
          personal data processed to run this job marketplace. When you apply to a job, the employer
          that receives your application decides for itself how to use it and is a controller of
          that copy; we are responsible for how the platform handles it.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>Identity: email, name, phone (optional), avatar.</li>
          <li>
            Profile: headline, bio, skills, work history, education, location, salary expectations.
          </li>
          <li>
            Applications: résumé files, the text we extract from them, cover letters, status
            history, and any notes an employer records about your application.
          </li>
          <li>Messages you send in job and talent chats.</li>
          <li>
            Security and usage: IP address and device details in security logs; page-view counts for
            job postings; error reports from your browser.
          </li>
        </ul>

        <h2>Why we use it, and on what basis</h2>
        <ul>
          <li>
            <strong>Providing the service</strong> — your account, profile, applications and chats
            (contract).
          </li>
          <li>
            <strong>Résumé parsing and match scores</strong> — extracting your details from a résumé
            you upload and comparing it with job postings (contract and our legitimate interest in
            making matching useful). See <a href="/legal/ai">how we use AI</a>. No decision about
            you is made by automated means alone.
          </li>
          <li>
            <strong>Security, fraud and abuse prevention</strong> (legitimate interest).
          </li>
          <li>
            <strong>Daily jobs digest</strong> by email (your consent, given by switching it on in
            your notification settings; one click in every email turns it off).
          </li>
          <li>
            <strong>Analytics and session replay</strong> on error (your consent, given in the
            cookie banner).
          </li>
        </ul>

        <h2>Who receives your data</h2>
        <p>
          Employers you apply to receive your application, cover letter and résumé. Other candidates
          in a shared job chat see your name. Operational processors (
          <a href="/legal/processors">listed here</a>) provide hosting, database, search, email,
          monitoring and AI services under data-processing agreements. Some of them are located in,
          or access data from, the United States; where personal data leaves the EEA or UK it is
          protected by the safeguards the law requires, such as standard contractual clauses.
        </p>

        <h2>How long we keep it</h2>
        <ul>
          <li>Active accounts: kept while the account is active.</li>
          <li>Deleted accounts: removed after 30 days, including your stored résumés and logo.</li>
          <li>
            Résumés you delete: removed immediately — unless an employer has already received it
            with an application, in which case it is hidden from you and removed when those
            applications are.
          </li>
          <li>
            Audit-log entries: IP address and device details are removed after 90 days; the entry
            itself after 1 year.
          </li>
          <li>Job view analytics: 13 months, then purged.</li>
        </ul>

        <h2>Your rights</h2>
        <p>
          You can <a href="/account/export">download a copy of your data</a> (a JSON file, which is
          also your portable copy), correct it in your profile, or{' '}
          <a href="/account/delete">delete your account</a>. You can object to or restrict
          processing, withdraw consent at any time (notification settings and the cookie banner),
          and ask for a person to review anything an automated score contributed to — write to the
          address below. We respond within 30 days. You may also complain to your data-protection
          authority.
        </p>

        <h2>Cookies</h2>
        <p>
          Essential cookies keep you signed in. Analytics (Vercel Analytics and Speed Insights) and
          error-replay sampling run only if you accept them in the cookie banner. Job-view counts
          are recorded without a person identifier unless you accepted analytics, and IP addresses
          are stored only as a keyed, daily-rotating hash.
        </p>

        <h2>Children</h2>
        <p>Joblify is not directed at anyone under 18.</p>

        <p className="text-fg-subtle">
          Contact: <a href={`mailto:${CONTACTS.privacy}`}>{CONTACTS.privacy}</a>
        </p>
      </div>
    </main>
  );
}
