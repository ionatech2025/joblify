import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ padding: '4rem 2rem', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', margin: 0 }}>404</h1>
      <p style={{ color: '#666' }}>We couldn&apos;t find that page.</p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
        <Link
          href="/jobs"
          style={{ padding: '0.6rem 1.1rem', background: '#111', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
        >
          Browse jobs
        </Link>
        <Link
          href="/"
          style={{ padding: '0.6rem 1.1rem', border: '1px solid #ccc', borderRadius: 8, color: '#111', textDecoration: 'none' }}
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
