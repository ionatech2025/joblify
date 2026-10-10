import { PageHeader } from '@/app/components/ui/ambient';
import { groqTasks, listTasks } from '@/lib/ai/groq-config';

export const metadata = { title: 'Data processors' };

// The "Where" column used to assert regions ("EU", "EU + US", "ZDR contracts")
// that nothing in the code or configuration enforced — and the database host
// the project actually pointed at was in the US. Region is deployment
// configuration, so it is published from configuration: set the variable named
// in each row to the region this deployment really uses. Until it is set the
// page says so rather than guessing.
const NOT_PUBLISHED = 'Not yet published';

// Which AI processor receives what is decided by the same switches that route
// the calls (lib/ai/groq-config.ts), so this page cannot say Groq is used when
// it is not, or the reverse. Groq is called directly with our own account; the
// Gateway is the route for everything else and the fallback when a Groq model is
// unavailable, so a task on Groq can still reach the Gateway's providers.
function aiRows() {
  const onGroq = groqTasks();
  if (onGroq.length === 0) {
    return [
      {
        name: 'AI model providers via Vercel AI Gateway',
        purpose:
          'AI features (résumé reading, job skill extraction, bio coach, match score) — see How we use AI',
        region: process.env.NEXT_PUBLIC_REGION_AI,
      },
    ];
  }
  return [
    {
      name: 'Groq',
      purpose: `AI inference, called directly, for ${listTasks(onGroq)} — the text of what you submit to those features is sent to it. See How we use AI`,
      region: process.env.NEXT_PUBLIC_REGION_GROQ,
    },
    {
      name: 'AI model providers via Vercel AI Gateway',
      purpose:
        'Match score and the other AI features not listed under Groq, and the fallback if a Groq model is unavailable — see How we use AI',
      region: process.env.NEXT_PUBLIC_REGION_AI,
    },
  ];
}

const PROCESSORS = [
  {
    name: 'Vercel',
    purpose: 'Hosting, edge network, function compute, file storage',
    region: process.env.NEXT_PUBLIC_REGION_HOSTING,
  },
  { name: 'Neon', purpose: 'Postgres database', region: process.env.NEXT_PUBLIC_REGION_DATABASE },
  {
    name: 'Upstash',
    purpose: 'Redis rate limiting',
    region: process.env.NEXT_PUBLIC_REGION_REDIS,
  },
  {
    name: 'Clerk',
    purpose: 'Authentication, MFA, OAuth providers',
    region: process.env.NEXT_PUBLIC_REGION_AUTH,
  },
  { name: 'Algolia', purpose: 'Search index', region: process.env.NEXT_PUBLIC_REGION_SEARCH },
  {
    name: 'Resend',
    purpose: 'Transactional and digest email',
    region: process.env.NEXT_PUBLIC_REGION_EMAIL,
  },
  {
    name: 'Sentry',
    purpose: 'Error tracking + traces',
    region: process.env.NEXT_PUBLIC_REGION_MONITORING,
  },
  ...aiRows(),
];

export default function ProcessorsPage() {
  return (
    <main>
      <PageHeader
        eyebrow="Legal"
        title="Data processors"
        subtitle="Each third party below processes data on our behalf. We minimize data shared with each."
        width="max-w-5xl"
      />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-soft">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-fg-muted">
                <th className="px-4 py-2 font-medium">Processor</th>
                <th className="px-4 py-2 font-medium">Purpose</th>
                <th className="px-4 py-2 font-medium">Region</th>
              </tr>
            </thead>
            <tbody>
              {PROCESSORS.map((p) => (
                <tr key={p.name} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold text-fg">{p.name}</td>
                  <td className="px-4 py-3 text-fg-muted">{p.purpose}</td>
                  <td className="px-4 py-3 text-fg-muted">{p.region || NOT_PUBLISHED}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
