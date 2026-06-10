import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { accountExportLimit } from '@/lib/ratelimit';
import { runGdprExport } from '@/workflows/gdpr-export.workflow';
import { logger } from '@/lib/observability/logger';

export const maxDuration = 60;

export async function POST() {
  const user = await requireUser();

  const rl = await accountExportLimit(user.id);
  if (!rl.success)
    return NextResponse.json({ error: 'rate-limited', retryAfter: rl.reset }, { status: 429 });

  try {
    const { url } = await runGdprExport({ userId: user.id });
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    logger.error({ err, userId: user.id }, 'GDPR export failed');
    return NextResponse.json({ error: 'export failed' }, { status: 500 });
  }
}
