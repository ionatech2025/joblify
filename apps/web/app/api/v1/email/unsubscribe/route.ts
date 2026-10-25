import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe';
import { unsubscribeLimit } from '@/lib/ratelimit';
import { clientIp } from '@/lib/security/client-ip';
import { logger } from '@/lib/observability/logger';

// One-click unsubscribe for the daily digest.
//
//   POST ?t=<token>   RFC 8058: mail clients (Gmail/Yahoo/Apple/Outlook) POST
//                     here with `List-Unsubscribe=One-Click` when the user hits
//                     their native "Unsubscribe" button. Also what the page's
//                     own confirm button submits. Performs the opt-out.
//   GET  ?t=<token>   The visible link in the email body. Deliberately does NOT
//                     opt out: link scanners and prefetchers GET every URL in a
//                     message, and a scan must not unsubscribe people. It shows
//                     a confirm button that POSTs.
//
// No session is involved — the signed token is the credential, and it can only
// ever switch the digest OFF (see lib/email/unsubscribe.ts).

const PAGE_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  // The token is in the URL; never let it leak through a Referer.
  'Referrer-Policy': 'no-referrer',
};

function page(title: string, body: string, status = 200): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${title} · Joblify</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.25rem;color:#111}
h1{font-size:1.4rem}button{font:inherit;padding:.6rem 1.1rem;border-radius:999px;border:0;background:#111;color:#fff;cursor:pointer}
a{color:inherit}</style></head><body><main>${body}</main></body></html>`;
  return new NextResponse(html, { status, headers: PAGE_HEADERS });
}

function tokenFrom(req: Request): string | null {
  return new URL(req.url).searchParams.get('t');
}

export async function GET(req: Request) {
  const token = tokenFrom(req);
  if (!token || !verifyUnsubscribeToken(token)) {
    return page(
      'Link not valid',
      '<h1>This unsubscribe link is not valid</h1><p>You can manage email preferences any time from your Joblify notifications page.</p>',
      400,
    );
  }
  return page(
    'Unsubscribe',
    `<h1>Unsubscribe from the daily jobs digest?</h1>
<p>You will stop receiving the daily email of new jobs. Account and application emails are not affected.</p>
<form method="post" action="/api/v1/email/unsubscribe?t=${encodeURIComponent(token)}">
<button type="submit">Yes, unsubscribe me</button></form>`,
  );
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers) ?? 'unknown';
  const rl = await unsubscribeLimit(ip);
  if (!rl.success) return NextResponse.json({ error: 'rate-limited' }, { status: 429 });

  const token = tokenFrom(req);
  const userId = token ? verifyUnsubscribeToken(token) : null;
  if (!userId) {
    return page(
      'Link not valid',
      '<h1>This unsubscribe link is not valid</h1><p>Open your Joblify notifications page to manage email preferences.</p>',
      400,
    );
  }

  try {
    const { count } = await db.user.updateMany({
      where: { id: userId, digestOptIn: true },
      data: { digestOptIn: false },
    });
    if (count > 0) {
      await db.auditEvent
        .create({
          data: {
            actorId: userId,
            action: 'CONSENT_UPDATED',
            entity: 'user',
            entityId: userId,
            before: { digestOptIn: true },
            after: { digestOptIn: false, via: 'one-click' },
            ip,
            ua: req.headers.get('user-agent'),
          },
        })
        .catch((err: unknown) => logger.warn({ err }, 'unsubscribe audit write failed'));
      logger.info({ userId }, 'digest unsubscribed via one-click');
    }
  } catch (err) {
    logger.error({ err }, 'unsubscribe failed');
    return page(
      'Something went wrong',
      '<h1>We could not process that</h1><p>Please try again.</p>',
      500,
    );
  }

  // Idempotent: an already-unsubscribed user gets the same confirmation.
  return page(
    'Unsubscribed',
    '<h1>You are unsubscribed</h1><p>You will no longer get the daily jobs digest. You can turn it back on from your notifications page whenever you like.</p>',
  );
}
