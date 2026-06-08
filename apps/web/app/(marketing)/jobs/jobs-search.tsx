'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchStore } from '@/lib/stores/search';
import type { JobSearchRecord } from '@/lib/search/algolia';

type SearchResponse = {
  hits: JobSearchRecord[];
  nbHits: number;
  page: number;
  nbPages: number;
};

// Client search — talks to /api/v1/jobs/search which calls Algolia.
// Filter draft lives in Zustand; committed query lives in URL + TanStack Query.
export function JobsSearch() {
  const draft = useSearchStore((s) => s.draft);
  const setField = useSearchStore((s) => s.setField);
  const resetDraft = useSearchStore((s) => s.resetDraft);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['jobs-search', draft],
    queryFn: async (): Promise<SearchResponse> => {
      const params = new URLSearchParams();
      if (draft.query) params.set('q', draft.query);
      if (draft.location) params.set('location', draft.location);
      if (draft.workMode) params.set('workMode', draft.workMode);
      if (draft.jobType) params.set('jobType', draft.jobType);
      if (draft.experienceLevel) params.set('experienceLevel', draft.experienceLevel);
      if (draft.salaryMin) params.set('salaryMin', String(draft.salaryMin));
      if (draft.radiusKm) params.set('radiusKm', String(draft.radiusKm));
      const res = await fetch(`/api/v1/jobs/search?${params.toString()}`);
      if (!res.ok) throw Object.assign(new Error('search failed'), { status: res.status });
      return res.json();
    },
    staleTime: 30_000,
  });

  // Debounce-free: TanStack Query handles refetching, useSearchStore handles
  // controlled inputs. Field changes trigger a refetch via queryKey identity.
  useEffect(() => {
    /* placeholder — could push to URL params here for shareable searches */
  }, [draft]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem' }}>
      <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="search"
          placeholder="Title, company, or keyword"
          value={draft.query}
          onChange={(e) => setField('query', e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="City or country"
          value={draft.location}
          onChange={(e) => setField('location', e.target.value)}
          style={inputStyle}
        />
        <select
          value={draft.workMode ?? ''}
          onChange={(e) => setField('workMode', (e.target.value || null) as never)}
          style={inputStyle}
        >
          <option value="">Any work mode</option>
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ONSITE">On-site</option>
        </select>
        <select
          value={draft.jobType ?? ''}
          onChange={(e) => setField('jobType', (e.target.value || null) as never)}
          style={inputStyle}
        >
          <option value="">Any job type</option>
          <option value="FULL_TIME">Full-time</option>
          <option value="PART_TIME">Part-time</option>
          <option value="CONTRACT">Contract</option>
          <option value="INTERNSHIP">Internship</option>
          <option value="TEMPORARY">Temporary</option>
        </select>
        <select
          value={draft.experienceLevel ?? ''}
          onChange={(e) => setField('experienceLevel', (e.target.value || null) as never)}
          style={inputStyle}
        >
          <option value="">Any experience</option>
          <option value="ENTRY">Entry</option>
          <option value="MID">Mid</option>
          <option value="SENIOR">Senior</option>
          <option value="STAFF">Staff</option>
          <option value="EXECUTIVE">Executive</option>
        </select>
        <input
          type="number"
          placeholder="Min salary"
          value={draft.salaryMin ?? ''}
          onChange={(e) => setField('salaryMin', e.target.value ? Number(e.target.value) : null)}
          style={inputStyle}
        />
        <button onClick={resetDraft} style={buttonStyle('secondary')}>
          Clear
        </button>
      </aside>

      <section>
        {isLoading && <p>Searching…</p>}
        {isError && <p style={{ color: '#a00' }}>Search failed. Try again.</p>}
        {data && data.hits.length === 0 && <p style={{ color: '#888' }}>No results.</p>}
        {data && data.hits.length > 0 && (
          <>
            <p style={{ color: '#666', margin: '0 0 1rem' }}>{data.nbHits.toLocaleString()} results</p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
              {data.hits.map((hit) => (
                <li key={hit.objectID} style={cardStyle}>
                  <Link href={`/jobs/${hit.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    <h3 style={{ margin: '0 0 0.25rem' }}>{hit.title}</h3>
                    <p style={{ margin: 0, color: '#555' }}>
                      {hit.companyName}
                      {hit.location ? ` · ${hit.location}` : ''}
                      {hit.workMode === 'REMOTE' ? ' · Remote' : ''}
                    </p>
                    {hit.salaryMin && hit.salaryMax && (
                      <p style={{ margin: '0.25rem 0 0', color: '#444' }}>
                        {hit.salaryCurrency} {hit.salaryMin.toLocaleString()}–{hit.salaryMax.toLocaleString()}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
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

function buttonStyle(variant: 'primary' | 'secondary'): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '0.6rem',
    borderRadius: 6,
    fontWeight: 500,
    border: 0,
    cursor: 'pointer',
  };
  return variant === 'primary'
    ? { ...base, background: '#111', color: 'white' }
    : { ...base, background: '#f1f1f1', color: '#111' };
}
