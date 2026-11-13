// @vitest-environment jsdom
//
// /jobs on a phone: the secondary filters fold behind a toggle so results start
// on the first screen. The toggle must expose its state and say how many of the
// folded filters are narrowing the results, so nothing hidden is a surprise.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const m = vi.hoisted(() => ({ qs: '' }));

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(m.qs) }));
vi.mock('@/app/actions/saved-searches', () => ({ saveSearch: vi.fn() }));

import { JobsSearch } from '@/app/(marketing)/jobs/jobs-search';
import { canonicalSearchString } from '@/lib/search/job-search-query';

function renderAt(qs: string) {
  m.qs = qs;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <JobsSearch
        initialQs={canonicalSearchString(new URLSearchParams(qs))}
        initialData={{ hits: [], nbHits: 0, page: 0, nbPages: 0 }}
      />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe('JobsSearch secondary filters', () => {
  it('starts folded and toggles open, controlling the folded region', async () => {
    renderAt('');
    const toggle = screen.getByRole('button', { name: 'More filters' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const region = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
    expect(region?.contains(screen.getByLabelText('Minimum salary'))).toBe(true);

    await userEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps keyword and location outside the folded region', () => {
    renderAt('');
    const region = document.getElementById('job-filters-more');
    expect(region?.contains(screen.getByLabelText('Location'))).toBe(false);
    expect(
      region?.contains(screen.getByLabelText('Search jobs by title, company, or keyword')),
    ).toBe(false);
  });

  it('counts the folded filters that are narrowing the results', () => {
    renderAt('q=react&workMode=REMOTE&salaryMin=1000');
    expect(screen.getByRole('button', { name: 'More filters (2 on)' })).toBeTruthy();
  });
});
