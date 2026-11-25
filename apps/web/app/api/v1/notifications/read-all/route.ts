import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const ReadAllSchema = z.object({ upTo: z.string().datetime() });

// `upTo` is the newest notification the client showed, so one that lands after
// the list was drawn stays unread.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const parsed = ReadAllSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  const { count } = await db.notification.updateMany({
    where: { userId: user.id, readAt: null, createdAt: { lte: new Date(parsed.data.upTo) } },
    data: { readAt: new Date() },
  });

  return NextResponse.json(
    { ok: true, updated: count },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
