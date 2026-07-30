import { ImageResponse } from 'next/og';
import { getCompanyBySlug } from '../page';

// Route Handler, not the opengraph-image.tsx special-file convention — see
// the comment in jobs/[slug]/opengraph-image/route.tsx for why: Next
// 16.2.7 + Turbopack fails to route that convention when nested inside a
// route group. generateMetadata in ../page.tsx sets openGraph.images/
// twitter.images to this route's path explicitly, since the auto-detection
// that the special-file convention gets doesn't apply to a route handler.
type Params = Promise<{ slug: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  return new ImageResponse(
    (
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
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: '#fafafa',
              maxWidth: 1000,
            }}
          >
            {company?.companyName ?? 'Company profile'}
          </div>
          {company?.description && (
            <div
              style={{
                display: 'flex',
                marginTop: 24,
                fontSize: 30,
                color: '#a3a3a3',
                maxWidth: 900,
              }}
            >
              {company.description.slice(0, 120)}
              {company.description.length > 120 ? '…' : ''}
            </div>
          )}
        </div>

        {company?.industry && (
          <div
            style={{
              display: 'flex',
              padding: '10px 22px',
              borderRadius: 999,
              background: '#fafafa',
              color: '#0a0a0a',
              fontSize: 24,
              fontWeight: 600,
              alignSelf: 'flex-start',
            }}
          >
            {company.industry.charAt(0) + company.industry.slice(1).toLowerCase()}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
