import { NextResponse } from 'next/server';
import { runDigest } from '@/workflows/digest-email.workflow';

export const maxDuration = 300;

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await runDigest();
  return NextResponse.json({ ok: true, ran: 'digest-email', at: new Date().toISOString(), ...result });
}
