import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { Building2 } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { PageHeader } from '@/app/components/ui/ambient';
import { EmptyState } from '@/app/components/ui/empty-state';
import { SkeletonList } from '@/app/components/ui/skeleton';
import { IslandBoundary } from '@/app/components/island-boundary';
import { Button, buttonClasses } from '@/app/components/ui/button';
import { Input, Select } from '@/app/components/ui/form';
import { INDUSTRY_OPTIONS, SIZE_LABELS, SIZE_VALUES } from '@/app/company/company-profile-schema';
import { companySizeLabel, industryLabel } from '@/lib/ui/status';
import type { IndustryType, CompanySize, Prisma } from '@prisma/client';

export const metadata = {
  title: 'Companies hiring on Joblify',
  description: 'Browse verified companies hiring across industries.',
};

type SearchParams = Promise<{
  q?: string;
  industry?: string;
  size?: string;
  location?: string;
}>;

export default function CompaniesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main>
      <PageHeader
        eyebrow="Directory"
        title="Companies hiring"
        subtitle="Browse verified companies hiring across industries."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <IslandBoundary
          fallback={
            <EmptyState
              icon={<Building2 />}
              title="Couldn’t load companies"
              description="Try again in a moment, or search open roles directly."
              action={
                <Link href="/jobs" className={`${buttonClasses()} no-underline`}>
                  Browse jobs
                </Link>
              }
            />
          }
        >
          <Suspense fallback={<SkeletonList count={6} />}>
            <CompaniesList searchParams={searchParams} />
          </Suspense>
        </IslandBoundary>
      </div>
    </main>
  );
}

function sanitizeQuery(raw?: string): string {
  if (!raw) return '';
  return raw.replace(/<[^>]*>?/gm, '').trim();
}

async function CompaniesList({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  let companies: Awaited<ReturnType<typeof getCompaniesList>>;
  try {
    companies = await getCompaniesList(params);
  } catch {
    return (
      <EmptyState
        icon={<Building2 />}
        title="Couldn’t load companies"
        description="Try again in a moment, or search open roles directly."
        action={
          <Link href="/jobs" className={`${buttonClasses()} no-underline`}>
            Browse jobs
          </Link>
        }
      />
    );
  }
  const hasFilters = Boolean(params.q || params.industry || params.size || params.location);

  return (
    <>
      <form
        method="get"
        action="/companies"
        role="search"
        aria-label="Filter companies"
        className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
      >
        <Input
          type="search"
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Company name"
          aria-label="Search companies by name"
        />
        <Select name="industry" defaultValue={params.industry ?? ''} aria-label="Industry">
          <option value="">All industries</option>
          {INDUSTRY_OPTIONS.map((ind) => (
            <option key={ind} value={ind}>
              {industryLabel(ind)}
            </option>
          ))}
        </Select>
        <Select name="size" defaultValue={params.size ?? ''} aria-label="Company size">
          <option value="">Any size</option>
          {SIZE_VALUES.map((s) => (
            <option key={s} value={s}>
              {SIZE_LABELS[s]} employees
            </option>
          ))}
        </Select>
        <Input
          type="text"
          name="location"
          defaultValue={params.location ?? ''}
          placeholder="City or country"
          aria-label="Location"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="secondary">
            Filter
          </Button>
          {hasFilters && (
            <Link href="/companies" className={`${buttonClasses('ghost', 'sm')} no-underline`}>
              Clear
            </Link>
          )}
        </div>
      </form>

      {companies.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title="No companies found"
          description="Try adjusting your search or filters to find verified companies."
          action={
            <Link href="/companies" className={`${buttonClasses('secondary')} no-underline`}>
              Clear filters
            </Link>
          }
        />
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <li key={c.id}>
              <Link href={`/companies/${c.slug}`} className="block h-full no-underline">
                <Card className="flex h-full items-start gap-4 transition-shadow hover:shadow-md">
                  {c.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote company logo, fixed small size
                    <img
                      src={c.logoUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="size-12 shrink-0 rounded-control object-cover"
                    />
                  ) : (
                    <div
                      className="size-12 shrink-0 rounded-control bg-surface-sunken"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                    <h3 className="text-fg m-0 text-base font-semibold">{c.companyName}</h3>
                    {c.address && (
                      <p className="text-fg-muted mt-0.5 mb-0 truncate text-xs">{c.address}</p>
                    )}
                    {c.description && (
                      <p className="text-fg-subtle mt-1.5 mb-0 line-clamp-2 text-sm leading-snug">
                        {c.description}
                      </p>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <Badge tone="neutral">{industryLabel(c.industry)}</Badge>
                      <Badge tone="neutral">{companySizeLabel(c.companySize, true)}</Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export async function getCompaniesList(filters?: {
  q?: string;
  industry?: string;
  size?: string;
  location?: string;
}) {
  const query = sanitizeQuery(filters?.q);
  const validIndustry =
    filters?.industry &&
    INDUSTRY_OPTIONS.includes(filters.industry as (typeof INDUSTRY_OPTIONS)[number])
      ? (filters.industry as IndustryType)
      : undefined;
  const validSize =
    filters?.size && SIZE_VALUES.includes(filters.size as (typeof SIZE_VALUES)[number])
      ? (filters.size as CompanySize)
      : undefined;
  const location = sanitizeQuery(filters?.location);

  const where: Prisma.CompanyProfileWhereInput = {
    verificationStatus: 'VERIFIED',
    ...(query ? { companyName: { contains: query, mode: 'insensitive' } } : {}),
    ...(validIndustry ? { industry: validIndustry } : {}),
    ...(validSize ? { companySize: validSize } : {}),
    ...(location ? { address: { contains: location, mode: 'insensitive' } } : {}),
  };

  return db.companyProfile.findMany({
    where,
    orderBy: { companyName: 'asc' },
    take: 60,
  });
}
