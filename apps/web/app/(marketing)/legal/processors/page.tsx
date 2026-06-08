export const metadata = { title: 'Data processors' };

const PROCESSORS = [
  { name: 'Vercel', purpose: 'Hosting, edge network, function compute, blob storage', region: 'EU + US' },
  { name: 'Neon', purpose: 'Postgres database', region: 'EU' },
  { name: 'Upstash', purpose: 'Redis cache + rate limiting', region: 'EU' },
  { name: 'Clerk', purpose: 'Authentication, MFA, OAuth providers', region: 'EU + US' },
  { name: 'Algolia', purpose: 'Search index', region: 'EU + US' },
  { name: 'Resend', purpose: 'Transactional email', region: 'EU + US' },
  { name: 'Sentry', purpose: 'Error tracking + traces', region: 'EU + US' },
  { name: 'OpenAI / Anthropic via Vercel AI Gateway', purpose: 'AI features (resume parse, JD skill extraction, bio coach, match score)', region: 'US (ZDR contracts)' },
];

export default function ProcessorsPage() {
  return (
    <main style={{ padding: '3rem 2rem', maxWidth: 960, margin: '0 auto', lineHeight: 1.6 }}>
      <h1>Data processors</h1>
      <p>
        Each of the third parties below processes data on our behalf under a Data Processing
        Agreement. We minimize data shared with each.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #ddd' }}>Processor</th>
            <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #ddd' }}>Purpose</th>
            <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #ddd' }}>Region</th>
          </tr>
        </thead>
        <tbody>
          {PROCESSORS.map((p) => (
            <tr key={p.name} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{p.name}</td>
              <td style={{ padding: '0.6rem 0.5rem' }}>{p.purpose}</td>
              <td style={{ padding: '0.6rem 0.5rem' }}>{p.region}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
