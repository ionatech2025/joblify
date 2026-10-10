import { NextResponse } from 'next/server';
import { logger } from '@/lib/observability/logger';
import { safeEqual } from '@/lib/security/timing-safe';

// Cron endpoints must fail CLOSED: a missing CRON_SECRET means the platform is
// misconfigured, not that auth is optional. Without this guard the expected
// header degrades to the guessable literal `Bearer undefined`.
export function requireCronAuth(req: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.error('CRON_SECRET is not set — refusing to run cron handler');
    return NextResponse.json({ error: 'cron auth unconfigured' }, { status: 500 });
  }
  const header = req.headers.get('authorization') ?? '';
  if (!safeEqual(header, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return null;
}
