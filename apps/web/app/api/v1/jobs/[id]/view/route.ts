import { NextResponse, after } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { viewBeaconLimit } from '@/lib/ratelimit';
import { clientIp, hashIpForAnalytics } from '@/lib/security/client-ip';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Same cookie the banner writes and <AnalyticsGate> reads.
function hasAnalyticsConsent(req: Request): boolean {
  const cookie = req.headers.get('cookie') ?? '';
  return cookie.split(/;\s*/).includes('joblify_consent=all');
}

// View beacon (navigator.sendBeacon from the JD page). Records an append-only
// JobView and bumps viewCount. Best-effort analytics — always 204, never blocks.
//
// Privacy posture:
//   - the IP is HMAC-keyed and day-salted (see hashIpForAnalytics), never raw
//     and never reversible by enumeration;
//   - the signed-in user id and the referrer — the parts that make a view
//     identify a *person* — are stored only when the visitor accepted analytics.
//     Without consent a view is an anonymous count.
//
// Abuse posture: unauthenticated and write-amplifying (a read plus two writes
// per call), so it is rate limited per IP. Over the limit still answers 204 —
// the beacon is fire-and-forget and must not reveal the limiter.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = new NextResponse(null, { status: 204 });
  if (!UUID.test(id)) return ok;

  const ip = clientIp(req.headers) ?? 'unknown';
  const rl = await viewBeaconLimit(ip);
  if (!rl.success) return ok;

  const job = await db.jobPost.findFirst({
    where: { id, status: 'PUBLISHED', deletedAt: null },
    select: { id: true },
  });
  if (!job) return ok;

  const consented = hasAnalyticsConsent(req);
  const user = consented ? await currentUser().catch(() => null) : null;
  const ipHash = hashIpForAnalytics(ip);
  const referrer = consented ? req.headers.get('referer') : null;

  after(async () => {
    try {
      await db.$transaction([
        db.jobView.create({
          data: { jobPostId: id, userId: user?.id ?? null, ipHash, referrer },
        }),
        db.jobPost.update({ where: { id }, data: { viewCount: { increment: 1 } } }),
      ]);
    } catch {
      // best-effort analytics; never surface to the client
    }
  });

  return ok;
}
