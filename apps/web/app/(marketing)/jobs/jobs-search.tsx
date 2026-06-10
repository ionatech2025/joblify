'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { SignedIn } from '@clerk/nextjs';
import type { JobSearchRecord } from '@/lib/search/algolia';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';
import { SaveSearchButton } from './save-search-button';

type SearchResponse = { hits: JobSearchRecord[]; nbHits: number; page: number; nbPages: number };

const SELECTS = {
  workMode: [
    ['', 'Any work mode'],
    ['REMOTE', 'Remote'],
    ['HYBRID', 'Hybrid'],
    ['ONSITE', 'On-site'],
  ],
  jobType: [
    ['', 'Any job type'],
    ['FULL_TIME', 'Full-time'],
    ['PART_TIME', 'Part-time'],
    ['CONTRACT', 'Contract'],
    ['INTERNSHIP', 'Internship'],
    ['TEMPORARY', 'Temporary'],
  ],
  experienceLevel: [
    ['', 'Any experience'],
    ['ENTRY', 'Entry'],
    ['MID', 'Mid'],
    ['SENIOR', 'Senior'],
    ['STAFF', 'Staff'],
    ['EXECUTIVE', 'Executive'],
  ],
} as const;

const FILTER_LABELS: Record<keyof typeof SELECTS, string> = {
  workMode: 'Work mode',
  jobType: 'Job type',
  experienceLevel: 'Experience level',
};

const control =
  'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none';

// The URL is the single source of truth for a search, so results are shareable,
// bookmarkable, and survive refresh / back-forward. Text + salary inputs keep
// local state for smooth typing and debounce back into the URL; selects, sort,
// and pagination write to the URL directly. Results query off the URL string.
export function JobsSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const getp = (k: string) => searchParams.get(k) ?? '';
  const page = Number(searchParams.get('page') ?? '0') || 0;

  const [qText, setQText] = useState(getp('q'));
  const [locText, setLocText] = useState(getp('location'));
  const [salMin, setSalMin] = useState(getp('salaryMin'));
  const [salMax, setSalMax] = useState(getp('salaryMax'));

  // Resync local inputs to the URL when it changes externally (shared link,
  // back/forward, clear). Adjusting state during render — guarded so it can't
  // loop — is React's recommended alternative to a setState-in-effect.
  const [syncedQs, setSyncedQs] = useState(qs);
  if (qs !== syncedQs) {
    setSyncedQs(qs);
    setQText(getp('q'));
    setLocText(getp('location'));
    setSalMin(getp('salaryMin'));
    setSalMax(getp('salaryMax'));
  }

  // Debounce the free-text / number inputs into the URL (resetting to page 0).
  useEffect(() => {
    const cur = {
      q: searchParams.get('q') ?? '',
      location: searchParams.get('location') ?? '',
      salaryMin: searchParams.get('salaryMin') ?? '',
      salaryMax: searchParams.get('salaryMax') ?? '',
    };
    if (qText === cur.q && locText === cur.location && salMin === cur.salaryMin && salMax === cur.salaryMax) {
      return;
    }
    const t = setTimeout(
      () => patch({ q: qText, location: locText, salaryMin: salMin || null, salaryMax: salMax || null, page: '' }),
      400,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qText, locText, salMin, salMax]);

  function patch(updates: Record<string, string | number | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, String(v));
    }
    const query = next.toString();
    router.replace(query ? `/jobs?${query}` : '/jobs', { scroll: false });
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['jobs-search', qs],
    queryFn: async (): Promise<SearchResponse> => {
      const res = await fetch(`/api/v1/jobs/search?${qs}`);
      if (!res.ok) throw Object.assign(new Error('search failed'), { status: res.status });
      return res.json();
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-3">
        <input
          type="search"
          placeholder="Title, company, or keyword"
          aria-label="Search jobs by title, company, or keyword"
          value={qText}
          onChange={(e) => setQText(e.target.value)}
          className={control}
        />
        <input
          type="text"
          placeholder="City or country"
          aria-label="Location"
          value={locText}
          onChange={(e) => setLocText(e.target.value)}
          className={control}
        />
        {(['workMode', 'jobType', 'experienceLevel'] as const).map((field) => (
          <select
            key={field}
            aria-label={FILTER_LABELS[field]}
            value={getp(field)}
            onChange={(e) => patch({ [field]: e.target.value, page: '' })}
            className={control}
          >
            {SELECTS[field].map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        ))}
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min salary"
            aria-label="Minimum salary"
            value={salMin}
            onChange={(e) => setSalMin(e.target.value)}
            className={control}
          />
          <input
            type="number"
            min={0}
            placeholder="Max salary"
            aria-label="Maximum salary"
            value={salMax}
            onChange={(e) => setSalMax(e.target.value)}
            className={control}
          />
        </div>
        {qs.length > 0 && (
          <button
            onClick={() => router.replace('/jobs', { scroll: false })}
            className="rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
          >
            Clear filters
          </button>
        )}
      </aside>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-sm text-neutral-600">
            {isLoading && !data
              ? 'Searching…'
              : data
                ? `${data.nbHits.toLocaleString()} ${data.nbHits === 1 ? 'job' : 'jobs'}`
                : ''}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {qs.length > 0 && (
              <SignedIn>
                <SaveSearchButton key={qs} query={qs} />
              </SignedIn>
            )}
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              Sort
              <select
                value={getp('sort')}
                onChange={(e) => patch({ sort: e.target.value, page: '' })}
                className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">Relevance</option>
                <option value="recent">Most recent</option>
                <option value="salary">Highest salary</option>
              </select>
            </label>
          </div>
        </div>

        {isError && <p className="text-red-700">Search is unavailable right now. Try again shortly.</p>}
        {data && data.hits.length === 0 && !isLoading && (
          <p className="text-neutral-500">No jobs match these filters. Try broadening your search.</p>
        )}

        {data && data.hits.length > 0 && (
          <>
            <ul className="grid list-none grid-cols-1 gap-3 p-0">
              {data.hits.map((hit) => (
                <JobCard key={hit.objectID} hit={hit} />
              ))}
            </ul>
            {data.nbPages > 1 && (
              <nav className="mt-6 flex items-center justify-center gap-4" aria-label="Pagination">
                <button disabled={page <= 0} onClick={() => patch({ page: page - 1 })} className={pageBtn(page <= 0)}>
                  ← Prev
                </button>
                <span className="text-sm text-neutral-600">
                  Page {page + 1} of {data.nbPages}
                </span>
                <button
                  disabled={page >= data.nbPages - 1}
                  onClick={() => patch({ page: page + 1 })}
                  className={pageBtn(page >= data.nbPages - 1)}
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function JobCard({ hit }: { hit: JobSearchRecord }) {
  return (
    <li>
      <Link href={`/jobs/${hit.slug}`} className="block">
        <Card className="flex gap-4 transition-shadow hover:shadow-md">
          {hit.companyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote logo, fixed small size
            <img src={hit.companyLogoUrl} alt="" width={48} height={48} className="size-12 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="size-12 shrink-0 rounded-lg bg-neutral-100" aria-hidden="true" />
          )}
          <div className="min-w-0">
            {/* h2: the page h1 is "Search jobs"; card titles are the next level */}
            <h2 className="m-0 text-base font-semibold text-neutral-900">{hit.title}</h2>
            <p className="m-0 text-sm text-neutral-600">
              {hit.companyName}
              {hit.location ? ` · ${hit.location}` : ''}
              {hit.workMode === 'REMOTE' ? ' · Remote' : hit.workMode === 'HYBRID' ? ' · Hybrid' : ''}
              {hit.publishedAt ? ` · ${relativeDate(hit.publishedAt)}` : ''}
            </p>
            {hit.salaryMin && hit.salaryMax ? (
              <p className="mt-1 mb-0 text-sm font-semibold text-green-700">
                {hit.salaryCurrency} {hit.salaryMin.toLocaleString()}–{hit.salaryMax.toLocaleString()}
              </p>
            ) : null}
            {hit.description ? (
              <p className="mt-1.5 mb-0 line-clamp-2 text-sm leading-snug text-neutral-500">
                {hit.description.slice(0, 150)}
                {hit.description.length > 150 ? '…' : ''}
              </p>
            ) : null}
            {hit.skills?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {hit.skills.slice(0, 5).map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      </Link>
    </li>
  );
}

function relativeDate(ms: number): string {
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function pageBtn(disabled: boolean): string {
  return `rounded-md border border-neutral-300 px-4 py-2 text-sm ${
    disabled ? 'cursor-default bg-neutral-50 text-neutral-400' : 'bg-white text-neutral-900 hover:bg-neutral-50'
  }`;
}
