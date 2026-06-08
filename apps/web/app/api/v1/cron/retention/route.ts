import { NextResponse } from 'next/server';
import { runRetention } from '@/workflows/retention.workflow';

export const maxDuration = 300;

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const summary = await runRetention();
  return NextResponse.json({ ok: true, ran: 'retention', at: new Date().toISOString(), ...summary });
}
