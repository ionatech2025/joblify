import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pingRedis } from '@/lib/ratelimit';
import { pingAlgolia } from '@/lib/search/algolia';

// Database is load-bearing — every request needs it, so its failure makes the
// whole service unhealthy (503). Redis and Algolia both already degrade
// gracefully elsewhere (rate limiting fails open; search has its own
// fallback), so their failure is reported for dashboards/alerting but doesn't
// flip the overall status — matching how the rest of the app already treats
// them as optional dependencies, not as an SLA.
export async function GET() {
  const startedAt = Date.now();

  const [dbResult, redis, search] = await Promise.allSettled([
    db.$queryRaw`SELECT 1`,
    pingRedis(),
    pingAlgolia(),
  ]);

  const databaseOk = dbResult.status === 'fulfilled';

  return NextResponse.json(
    {
      status: databaseOk ? 'ok' : 'unhealthy',
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
    { status: databaseOk ? 200 : 503 },
  );
}
