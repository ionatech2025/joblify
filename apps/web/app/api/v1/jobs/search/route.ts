import { NextResponse, type NextRequest } from 'next/server';
import { clientIp } from '@/lib/security/client-ip';
import { searchLimit } from '@/lib/ratelimit';
import { SearchQuery, SearchUnavailableError, searchJobs } from '@/lib/search/jobs';

// The search itself lives in lib/search/jobs.ts so the /jobs server render runs
// exactly the same code. This handler is the transport: rate limit, validate,
// map the outcome to a status code.
export async function GET(req: NextRequest) {
  const ip = clientIp(req.headers) ?? 'unknown';
  const { success } = await searchLimit(ip);
  if (!success) return NextResponse.json({ error: 'rate-limited' }, { status: 429 });

  const url = new URL(req.url);
  const parsed = SearchQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid search parameters' }, { status: 400 });
  }

  try {
    const r = await searchJobs(parsed.data, { ip: ip !== 'unknown' ? ip : null });
    return NextResponse.json({ hits: r.hits, nbHits: r.nbHits, page: r.page, nbPages: r.nbPages });
  } catch (err) {
    const cause = err instanceof SearchUnavailableError ? err.cause : err;
    return NextResponse.json(
      {
        error: 'search backend unavailable',
        detail: process.env.NODE_ENV === 'development' ? String(cause) : undefined,
      },
      { status: 502 },
    );
  }
}
