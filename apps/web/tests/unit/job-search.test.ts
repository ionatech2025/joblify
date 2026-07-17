import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Search input validation (Phase 4 gap): every param is bounded/whitelisted
// before it reaches the Algolia query builder, so a malformed value gets a
// clean 400 instead of a broken filter string or a NaN slipping through.

const m = vi.hoisted(() => ({
  searchLimit: vi.fn(),
  search: vi.fn(),
}));

vi.mock('@/lib/ratelimit', () => ({ searchLimit: m.searchLimit }));
vi.mock('@/lib/search/algolia', () => ({
  adminClient: () => ({ search: m.search }),
  INDEX: { jobs: 'jobs', jobsRecent: 'jobs_recent', jobsSalaryDesc: 'jobs_salary_desc' },
}));

import { GET } from '@/app/api/v1/jobs/search/route';

function req(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/v1/jobs/search${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  m.searchLimit.mockResolvedValue({ success: true });
  m.search.mockResolvedValue({ results: [{ hits: [], nbHits: 0, page: 0, nbPages: 0 }] });
});

describe('GET /api/v1/jobs/search', () => {
  it('accepts a well-formed query', async () => {
    const res = await GET(req('?q=engineer&workMode=REMOTE&page=1'));
    expect(res.status).toBe(200);
    expect(m.search).toHaveBeenCalledTimes(1);
    const request = m.search.mock.calls[0]![0].requests[0];
    expect(request.query).toBe('engineer');
    expect(request.filters).toBe('workMode:REMOTE');
    expect(request.page).toBe(1);
  });

  it('rejects a query string over the length cap before calling Algolia', async () => {
    const res = await GET(req(`?q=${'a'.repeat(301)}`));
    expect(res.status).toBe(400);
    expect(m.search).not.toHaveBeenCalled();
  });

  it('rejects a workMode outside the enum whitelist', async () => {
    const res = await GET(req('?workMode=DROP TABLE'));
    expect(res.status).toBe(400);
    expect(m.search).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric salaryMin instead of coercing to NaN', async () => {
    const res = await GET(req('?salaryMin=not-a-number'));
    expect(res.status).toBe(400);
    expect(m.search).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric page', async () => {
    const res = await GET(req('?page=abc'));
    expect(res.status).toBe(400);
    expect(m.search).not.toHaveBeenCalled();
  });

  it('defaults page to 0 and trims whitespace from q when omitted/blank', async () => {
    const res = await GET(req('?q=%20%20engineer%20%20'));
    expect(res.status).toBe(200);
    const request = m.search.mock.calls[0]![0].requests[0];
    expect(request.query).toBe('engineer');
    expect(request.page).toBe(0);
  });

  it('still enforces rate limiting ahead of validation', async () => {
    m.searchLimit.mockResolvedValue({ success: false });
    const res = await GET(req('?q=engineer'));
    expect(res.status).toBe(429);
    expect(m.search).not.toHaveBeenCalled();
  });
});
