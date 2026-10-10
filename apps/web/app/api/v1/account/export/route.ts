import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { accountExportLimit } from '@/lib/ratelimit';
import { buildGdprExport } from '@/workflows/gdpr-export.workflow';
import { logger } from '@/lib/observability/logger';

export const maxDuration = 60;

// POST /api/v1/account/export
//
// Responds with the export itself as a file download. There is no stored copy
// and no link to leak: the bytes go to the authenticated session that asked.
export async function POST() {
  const user = await requireUser();

  const rl = await accountExportLimit(user.id);
  if (!rl.success)
    return NextResponse.json({ error: 'rate-limited', retryAfter: rl.reset }, { status: 429 });

  try {
    const { filename, json, counts } = await buildGdprExport({ userId: user.id });
    logger.info({ userId: user.id, counts }, 'GDPR export delivered');
    return new Response(json, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    logger.error({ err, userId: user.id }, 'GDPR export failed');
    return NextResponse.json({ error: 'export failed' }, { status: 500 });
  }
}
