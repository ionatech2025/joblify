import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { tags } from '@/lib/cache';

export const metadata = {
  title: 'Companies hiring on Joblify',
  description: 'Browse verified companies hiring across industries.',
};

export default function CompaniesPage() {
  return (
    <main style={{ padding: '3rem 2rem', maxWidth: 1080, margin: '0 auto' }}>
      <h1>Companies hiring</h1>
      <Suspense fallback={<p style={{ color: '#888' }}>Loading companies…</p>}>
        <CompaniesList />
      </Suspense>
    </main>
  );
}

async function CompaniesList() {
  // Dynamic boundary so the build needs no DB; the query is cached at runtime.
  await connection();
  const companies = await getCompaniesList();

  if (companies.length === 0) {
    return <p style={{ color: '#888' }}>No companies onboarded yet.</p>;
  }

  return (
    <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', listStyle: 'none', padding: 0 }}>
      {companies.map((c) => (
        <li key={c.id} style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: '1rem' }}>
          <Link href={`/companies/${c.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ margin: '0 0 0.25rem' }}>{c.companyName}</h3>
            <p style={{ margin: 0, color: '#666' }}>{c.industry.replace('_', ' ')}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function getCompaniesList() {
  'use cache';
  const { cacheTag, cacheLife } = await import('next/cache');
  cacheTag(tags.companies());
  cacheLife('hours');

  return db.companyProfile.findMany({
    where: { verificationStatus: 'VERIFIED' },
    orderBy: { companyName: 'asc' },
    take: 60,
  });
}
