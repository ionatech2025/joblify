import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Joblify — a job marketplace for jobseekers and companies';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Site-wide default. Every page's metadata falls back to this unless it
// defines its own opengraph-image (currently: job posts, company profiles).
// next/og's Satori renderer only supports a small CSS subset and can't load
// next/font's variable-font CSS, so this deliberately uses a system sans
// stack rather than trying to match .display/Archivo pixel-for-pixel — the
// weight/tracking/uppercase treatment carries the editorial look well enough
// without needing a fetched font file on every request.
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: '#0a0a0a',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 16,
            height: 16,
            borderRadius: 999,
            background: '#818cf8',
          }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#818cf8',
          }}
        >
          Joblify
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 36,
          fontSize: 76,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          color: '#fafafa',
          maxWidth: 980,
        }}
      >
        Find your next role
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 28,
          fontSize: 32,
          color: '#a3a3a3',
          maxWidth: 820,
        }}
      >
        A job marketplace for jobseekers and companies
      </div>
    </div>,
    { ...size },
  );
}
