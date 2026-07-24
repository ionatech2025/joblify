import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'Data processors' };

const PROCESSORS = [
  { name: 'Vercel', purpose: 'Hosting, edge network, function compute, blob storage', region: 'EU + US' },
  { name: 'Neon', purpose: 'Postgres database', region: 'EU' },
  { name: 'Upstash', purpose: 'Redis cache + rate limiting', region: 'EU' },
  { name: 'Clerk', purpose: 'Authentication, MFA, OAuth providers', region: 'EU + US' },
  { name: 'Algolia', purpose: 'Search index', region: 'EU + US' },
  { name: 'Resend', purpose: 'Transactional email', region: 'EU + US' },
  { name: 'Sentry', purpose: 'Error tracking + traces', region: 'EU + US' },
  {
    name: 'OpenAI / Anthropic via Vercel AI Gateway',
    purpose: 'AI features (resume parse, JD skill extraction, bio coach, match score)',
    region: 'US (ZDR contracts)',
  },
];

export default function ProcessorsPage() {
  return (
    <main>
      <PageHeader
        eyebrow="Legal"
        title="Data processors"
        subtitle="Each third party below processes data on our behalf under a Data Processing Agreement. We minimize data shared with each."
        width="max-w-5xl"
      />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-soft">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
              <th className="px-4 py-2 font-medium">Processor</th>
              <th className="px-4 py-2 font-medium">Purpose</th>
              <th className="px-4 py-2 font-medium">Region</th>
            </tr>
          </thead>
          <tbody>
            {PROCESSORS.map((p) => (
              <tr key={p.name} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-semibold text-neutral-900">{p.name}</td>
                <td className="px-4 py-3 text-neutral-700">{p.purpose}</td>
                <td className="px-4 py-3 text-neutral-700">{p.region}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </main>
  );
}
