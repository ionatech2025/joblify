import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/observability/logger';

// Clerk → Postgres user mirror. Verified via svix HMAC; idempotent upserts.
// Configure CLERK_WEBHOOK_SECRET in Vercel and point the Clerk webhook at
// `${NEXT_PUBLIC_SITE_URL}/api/v1/webhooks/clerk`.

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CLERK_WEBHOOK_SECRET not configured' }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'missing svix headers' }, { status: 400 });
  }

  const body = await req.text();

  let evt: WebhookEvent;
  try {
    evt = new Webhook(secret).verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    logger.warn({ err }, 'clerk webhook signature verification failed');
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  try {
    switch (evt.type) {
      case 'user.created':
      case 'user.updated': {
        // Array order isn't guaranteed to put the primary address first (e.g.
        // once an account links a second address/provider — a Google sign-up
        // adding a work email, say) — resolve it by id like lib/auth.ts's
        // provisionFromClerk does via primaryEmailAddress, or every later
        // user.updated mirrors the wrong email into Postgres.
        const email =
          evt.data.email_addresses?.find((e) => e.id === evt.data.primary_email_address_id)
            ?.email_address ?? evt.data.email_addresses?.[0]?.email_address;
        if (!email) {
          logger.warn({ clerkUserId: evt.data.id }, 'clerk user has no primary email');
          break;
        }
        await db.user.upsert({
          where: { clerkUserId: evt.data.id },
          update: {
            email,
            firstName: evt.data.first_name ?? null,
            lastName: evt.data.last_name ?? null,
            avatarUrl: evt.data.image_url ?? null,
          },
          create: {
            clerkUserId: evt.data.id,
            email,
            userType: 'JOB_SEEKER',
            firstName: evt.data.first_name ?? null,
            lastName: evt.data.last_name ?? null,
            avatarUrl: evt.data.image_url ?? null,
          },
        });
        break;
      }
      case 'user.deleted': {
        if (!evt.data.id) break;
        const now = new Date();
        const gone = await db.user.findUnique({
          where: { clerkUserId: evt.data.id },
          select: { id: true },
        });
        await db.user.updateMany({
          where: { clerkUserId: evt.data.id },
          data: { deletedAt: now, digestOptIn: false },
        });
        // Same rule as deleteMyAccount: a departed company's postings close now.
        if (gone) {
          await db.jobPost.updateMany({
            where: { companyId: gone.id, deletedAt: null },
            data: { status: 'ARCHIVED', deletedAt: now },
          });
        }
        break;
      }
      case 'organization.created':
      case 'organization.updated': {
        // Organizations represent companies. The org's creator becomes the
        // company owner via the organizationMembership.created event.
        logger.info({ orgId: evt.data.id }, 'clerk org event received');
        break;
      }
      case 'organizationMembership.created': {
        // Deliberately NOT a role change. This handler used to set
        // userType = COMPANY for any user who joined any Clerk organization.
        // The app does not provision organizations (companies are self-serve
        // User rows, authorised by userType + verification), but if
        // Organizations is ever enabled in the Clerk dashboard that would let
        // anyone mint themselves a COMPANY account without a company profile —
        // and the verification gate used to treat "no profile" as "fine".
        // Becoming a COMPANY goes through createCompanyProfile and admin
        // verification only.
        logger.info(
          { orgId: evt.data.organization?.id },
          'clerk organization membership ignored (organizations are not used for roles)',
        );
        break;
      }
      default:
        logger.info({ type: evt.type }, 'clerk webhook ignored');
    }
  } catch (err) {
    logger.error({ err, type: evt.type }, 'clerk webhook handler failed');
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
