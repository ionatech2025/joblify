import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { logger } from '@/lib/observability/logger';

// Resend webhook handler. Tracks delivery state for transactional + digest
// emails. Stored events: email.sent / delivered / opened / bounced /
// complained. We don't persist all of these — just enough for compliance
// (bounce + complaint suppression).

type ResendEvent = {
  type: string;
  data: {
    email_id: string;
    to: string[];
    subject?: string;
    created_at?: string;
  };
};

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret)
    return NextResponse.json({ error: 'RESEND_WEBHOOK_SECRET missing' }, { status: 500 });

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'missing svix headers' }, { status: 400 });
  }

  const body = await req.text();
  let evt: ResendEvent;
  try {
    evt = new Webhook(secret).verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ResendEvent;
  } catch (err) {
    logger.warn({ err }, 'resend webhook signature invalid');
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  // Suppress hard bounces + complaints so the digest (and transactional sends)
  // skip them — protects sender reputation and satisfies CAN-SPAM / GDPR.
  if (evt.type === 'email.bounced' || evt.type === 'email.complained') {
    const emails = evt.data.to ?? [];
    if (emails.length > 0) {
      const result = await db.user.updateMany({
        where: { email: { in: emails }, emailSuppressedAt: null },
        data: {
          emailSuppressedAt: new Date(),
          emailSuppressionReason: evt.type === 'email.bounced' ? 'BOUNCED' : 'COMPLAINED',
        },
      });
      logger.warn({ type: evt.type, matched: result.count }, 'recipients suppressed');
    }
  }

  logger.info({ type: evt.type, emailId: evt.data.email_id }, 'resend webhook');
  return NextResponse.json({ received: true });
}
