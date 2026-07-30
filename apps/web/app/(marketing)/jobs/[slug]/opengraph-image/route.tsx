import { ImageResponse } from 'next/og';
import { getJobBySlug } from '../page';

// Node.js runtime (not edge, unlike the root default): this needs Prisma,
// which this app runs on Node everywhere else.
//
// This is a Route Handler, not the opengraph-image.tsx special-file
// convention: Next 16.2.7 + Turbopack fails to route that convention when
// it's nested inside a route group ((marketing)/...) — reproducible even
// with a static segment and zero data dependency, confirmed by isolating it
// against a plain nested route outside the group, which resolved fine. A
// route handler at the same URL sidesteps it. Because this is no longer the
// special-file convention, Next won't auto-populate metadata `images` for
// it — generateMetadata in ../page.tsx sets openGraph.images/twitter.images
// to this route's path explicitly.
type Params = Promise<{ slug: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  const companyName = job?.company.companyProfile?.companyName ?? 'Joblify';

  const meta: string[] = [];
  if (job?.location) meta.push(job.location);
  // A location field that already reads "Remote"/"Hybrid" (common when the
  // poster fills it in that way) shouldn't produce a second identical pill.
  const workModeLabel =
    job?.workMode === 'REMOTE' ? 'Remote' : job?.workMode === 'HYBRID' ? 'Hybrid' : null;
  if (workModeLabel && job?.location?.trim().toLowerCase() !== workModeLabel.toLowerCase()) {
    meta.push(workModeLabel);
  }
  if (job?.salaryMin && job?.salaryMax) {
    meta.push(
      `${job.salaryCurrency} ${job.salaryMin.toLocaleString('en-US')}–${job.salaryMax.toLocaleString('en-US')}`,
    );
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '80px',
        background: '#0a0a0a',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#818cf8',
        }}
      >
        Joblify
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: job ? 64 : 76,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: '#fafafa',
            maxWidth: 1000,
          }}
        >
          {job?.title ?? 'Job posting'}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 20,
            fontSize: 34,
            color: '#a3a3a3',
          }}
        >
          {companyName}
        </div>
      </div>

      {meta.length > 0 && (
        <div style={{ display: 'flex', gap: 16 }}>
          {meta.map((m) => (
            <div
              key={m}
              style={{
                display: 'flex',
                padding: '10px 22px',
                borderRadius: 999,
                background: '#fafafa',
                color: '#0a0a0a',
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {m}
            </div>
          ))}
        </div>
      )}
    </div>,
    { width: 1200, height: 630 },
  );
}
