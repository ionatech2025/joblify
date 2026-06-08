import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { tags } from '@/lib/cache';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return { title: 'Company not found' };
  return {
    title: company.companyName,
    description: company.description.slice(0, 160),
  };
}

export default async function CompanyDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const openJobs = await db.jobPost.findMany({
    where: { companyId: company.userId, status: 'PUBLISHED', deletedAt: null },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-8 flex items-center gap-4">
        {company.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- remote company logo, fixed size
          <img src={company.logoUrl} alt="" width={72} height={72} className="size-[72px] rounded-xl object-cover" />
        )}
        <div>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{company.companyName}</h1>
          <p className="m-0 text-neutral-600">
            {company.industry.replace('_', ' ')} · {company.companySize.replace('_', ' ').toLowerCase()}
          </p>
        </div>
      </header>

      <article className="mb-8 leading-relaxed whitespace-pre-wrap text-neutral-800">{company.description}</article>

      {company.website && (
        <p>
          <a href={company.website} rel="noopener noreferrer" target="_blank" className="text-blue-700 hover:underline">
            {company.website}
          </a>
        </p>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-neutral-900">Open positions</h2>
        {openJobs.length === 0 ? (
          <p className="text-neutral-500">No open positions right now.</p>
        ) : (
          <ul className="list-none p-0">
            {openJobs.map((job) => (
              <li key={job.id} className="border-b border-neutral-100 py-3">
                <Link href={`/jobs/${job.slug}`} className="font-medium text-neutral-900 hover:underline">
                  {job.title}
                </Link>
                {job.location && <span className="text-neutral-600"> · {job.location}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

async function getCompanyBySlug(slug: string) {
  'use cache';
  const { cacheTag, cacheLife } = await import('next/cache');
  cacheLife('hours');

  const profile = await db.companyProfile.findUnique({ where: { slug } });
  if (!profile) return null;

  cacheTag(tags.company(profile.userId));
  return profile;
}
