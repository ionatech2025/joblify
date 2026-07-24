import { NextResponse } from 'next/server';
import { runRetention } from '@/workflows/retention.workflow';
import { requireCronAuth } from '@/lib/cron-auth';

export const maxDuration = 300;

export async function GET(req: Request) {
  const deny = requireCronAuth(req);
  if (deny) return deny;
  const summary = await runRetention();
  return NextResponse.json({ ok: true, ran: 'retention', at: new Date().toISOString(), ...summary });
}
