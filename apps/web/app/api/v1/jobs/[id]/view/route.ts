import { NextResponse, after } from 'next/server';
import { createHash } from 'node:crypto';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// View beacon (navigator.sendBeacon from the JD page). Records an append-only
// JobView and bumps viewCount. Best-effort analytics — always 204, never blocks.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new NextResponse(null, { status: 204 });

  const job = await db.jobPost.findFirst({
    where: { id, status: 'PUBLISHED', deletedAt: null },
    select: { id: true },
  });
  if (!job) return new NextResponse(null, { status: 204 });

  const user = await currentUser().catch(() => null);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 32);
  const referrer = req.headers.get('referer');

  after(async () => {
    try {
      await db.$transaction([
        db.jobView.create({
          data: { jobPostId: id, userId: user?.id ?? null, ipHash, referrer: referrer ?? null },
        }),
        db.jobPost.update({ where: { id }, data: { viewCount: { increment: 1 } } }),
      ]);
    } catch {
      // best-effort analytics; never surface to the client
    }
  });

  return new NextResponse(null, { status: 204 });
}
