import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { tags } from '@/lib/cache';
import { Card } from '@/app/components/ui/card';

export const metadata = {
  title: 'Companies hiring on Joblify',
  description: 'Browse verified companies hiring across industries.',
};

export default function CompaniesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Companies hiring</h1>
      <Suspense fallback={<p className="text-neutral-500">Loading companies…</p>}>
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
    return <p className="text-neutral-500">No companies onboarded yet.</p>;
  }

  return (
    <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {companies.map((c) => (
        <li key={c.id}>
          <Link href={`/companies/${c.slug}`} className="block no-underline">
            <Card className="h-full transition-shadow hover:shadow-md">
              <h3 className="m-0 font-semibold text-neutral-900">{c.companyName}</h3>
              <p className="mt-1 mb-0 text-sm text-neutral-600">{c.industry.replace('_', ' ')}</p>
            </Card>
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
