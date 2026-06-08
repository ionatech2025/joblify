'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { JobSearchRecord } from '@/lib/search/algolia';

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
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 260px) 1fr', gap: '2rem' }}>
      <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input type="search" placeholder="Title, company, or keyword" value={qText} onChange={(e) => setQText(e.target.value)} style={inputStyle} />
        <input type="text" placeholder="City or country" value={locText} onChange={(e) => setLocText(e.target.value)} style={inputStyle} />
        {(['workMode', 'jobType', 'experienceLevel'] as const).map((field) => (
          <select key={field} value={getp(field)} onChange={(e) => patch({ [field]: e.target.value, page: '' })} style={inputStyle}>
            {SELECTS[field].map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        ))}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="number" min={0} placeholder="Min salary" value={salMin} onChange={(e) => setSalMin(e.target.value)} style={{ ...inputStyle, width: '50%' }} />
          <input type="number" min={0} placeholder="Max salary" value={salMax} onChange={(e) => setSalMax(e.target.value)} style={{ ...inputStyle, width: '50%' }} />
        </div>
        {qs.length > 0 && (
          <button onClick={() => router.replace('/jobs', { scroll: false })} style={clearStyle}>
            Clear filters
          </button>
        )}
      </aside>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <p style={{ color: '#666', margin: 0 }}>
            {isLoading && !data ? 'Searching…' : data ? `${data.nbHits.toLocaleString()} ${data.nbHits === 1 ? 'job' : 'jobs'}` : ''}
          </p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
            Sort
            <select value={getp('sort')} onChange={(e) => patch({ sort: e.target.value, page: '' })} style={{ ...inputStyle, padding: '0.4rem' }}>
              <option value="">Relevance</option>
              <option value="recent">Most recent</option>
              <option value="salary">Highest salary</option>
            </select>
          </label>
        </div>

        {isError && <p style={{ color: '#a00' }}>Search is unavailable right now. Try again shortly.</p>}
        {data && data.hits.length === 0 && !isLoading && (
          <p style={{ color: '#888' }}>No jobs match these filters. Try broadening your search.</p>
        )}

        {data && data.hits.length > 0 && (
          <>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
              {data.hits.map((hit) => (
                <JobCard key={hit.objectID} hit={hit} />
              ))}
            </ul>
            {data.nbPages > 1 && (
              <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }} aria-label="Pagination">
                <button disabled={page <= 0} onClick={() => patch({ page: page - 1 })} style={pageBtn(page <= 0)}>
                  ← Prev
                </button>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                  Page {page + 1} of {data.nbPages}
                </span>
                <button disabled={page >= data.nbPages - 1} onClick={() => patch({ page: page + 1 })} style={pageBtn(page >= data.nbPages - 1)}>
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
    <li style={cardStyle}>
      <Link href={`/jobs/${hit.slug}`} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', gap: '1rem' }}>
        {hit.companyLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote logo, fixed small size
          <img src={hit.companyLogoUrl} alt="" width={48} height={48} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f1f1f1', flexShrink: 0 }} aria-hidden="true" />
        )}
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.05rem' }}>{hit.title}</h3>
          <p style={{ margin: 0, color: '#555', fontSize: '0.92rem' }}>
            {hit.companyName}
            {hit.location ? ` · ${hit.location}` : ''}
            {hit.workMode === 'REMOTE' ? ' · Remote' : hit.workMode === 'HYBRID' ? ' · Hybrid' : ''}
            {hit.publishedAt ? ` · ${relativeDate(hit.publishedAt)}` : ''}
          </p>
          {hit.salaryMin && hit.salaryMax ? (
            <p style={{ margin: '0.3rem 0 0', color: '#137333', fontSize: '0.9rem', fontWeight: 600 }}>
              {hit.salaryCurrency} {hit.salaryMin.toLocaleString()}–{hit.salaryMax.toLocaleString()}
            </p>
          ) : null}
          {hit.description ? (
            <p style={{ margin: '0.4rem 0 0', color: '#777', fontSize: '0.88rem', lineHeight: 1.4 }}>
              {hit.description.slice(0, 150)}
              {hit.description.length > 150 ? '…' : ''}
            </p>
          ) : null}
          {hit.skills?.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
              {hit.skills.slice(0, 5).map((s) => (
                <span key={s} style={{ fontSize: '0.78rem', background: '#eef2ff', color: '#3344aa', padding: '0.15rem 0.5rem', borderRadius: 999 }}>
                  {s}
                </span>
              ))}
            </div>
          ) : null}
        </div>
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

const inputStyle: React.CSSProperties = {
  padding: '0.6rem',
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: '0.95rem',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e5e5',
  borderRadius: 8,
  padding: '1rem',
  background: '#fff',
};

const clearStyle: React.CSSProperties = {
  padding: '0.6rem',
  borderRadius: 6,
  fontWeight: 500,
  border: 0,
  cursor: 'pointer',
  background: '#f1f1f1',
  color: '#111',
};

function pageBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: '0.5rem 1rem',
    borderRadius: 6,
    border: '1px solid #ddd',
    background: disabled ? '#f7f7f7' : '#fff',
    color: disabled ? '#bbb' : '#111',
    cursor: disabled ? 'default' : 'pointer',
  };
}
