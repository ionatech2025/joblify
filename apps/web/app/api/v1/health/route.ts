import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pingRedis } from '@/lib/ratelimit';
import { pingAlgolia } from '@/lib/search/algolia';
import { safeEqual } from '@/lib/security/timing-safe';

// Two audiences, two answers.
//
//   Anyone      → `{ status }` and a 200/503. That is all an uptime monitor or a
//                 load balancer needs, and it tells an attacker nothing.
//   Operators   → the full dependency report, region, commit and timings, for
//                 callers presenting `Authorization: Bearer $HEALTH_TOKEN`
//                 (falls back to CRON_SECRET so existing cron tooling works).
//
// The detailed form used to be public. It advertised `redis: "not_configured"`
// to the internet — i.e. "rate limiting is off, go ahead" — plus the deployed
// commit SHA and region, and every anonymous hit fanned out to Redis and
// Algolia as well as the database.
//
// The database is load-bearing (every request needs it), so its failure makes
// the whole service unhealthy (503). Redis and Algolia both degrade gracefully
// elsewhere (per-instance rate limiting; Postgres search fallback), so their
// failure is *reported* to operators but does not flip the overall status.

function isOperator(req: Request): boolean {
  const token = process.env.HEALTH_TOKEN ?? process.env.CRON_SECRET;
  if (!token) return false;
  const header = req.headers.get('authorization') ?? '';
  return safeEqual(header, `Bearer ${token}`);
}

export async function GET(req: Request) {
  const startedAt = Date.now();
  const operator = isOperator(req);

  const [dbResult, redis, search] = await Promise.allSettled([
    db.$queryRaw`SELECT 1`,
    operator ? pingRedis() : Promise.resolve('skipped' as const),
    operator ? pingAlgolia() : Promise.resolve('skipped' as const),
  ]);

  const databaseOk = dbResult.status === 'fulfilled';
  const status = databaseOk ? 'ok' : 'unhealthy';
  const init = {
    status: databaseOk ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  };

  if (!operator) return NextResponse.json({ status }, init);

  return NextResponse.json(
    {
      status,
      service: 'joblify-web',
      timestamp: new Date().toISOString(),
      region: process.env.VERCEL_REGION ?? 'local',
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      durationMs: Date.now() - startedAt,
      dependencies: {
        database: databaseOk ? 'ok' : 'error',
        redis: redis.status === 'fulfilled' ? redis.value : 'error',
        search: search.status === 'fulfilled' ? search.value : 'error',
      },
    },
    init,
  );
}
