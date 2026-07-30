import { NextResponse } from 'next/server';
import { runDigest } from '@/workflows/digest-email.workflow';
import { requireCronAuth } from '@/lib/cron-auth';

export const maxDuration = 300;

export async function GET(req: Request) {
  const deny = requireCronAuth(req);
  if (deny) return deny;
  // The workflow stops itself at ~80% of the budget so this response always
  // goes out; the per-user watermark resumes the remainder next run.
  const result = await runDigest({ deadlineMs: maxDuration * 1000 * 0.8 });
  return NextResponse.json({
    ok: true,
    ran: 'digest-email',
    at: new Date().toISOString(),
    ...result,
  });
}
