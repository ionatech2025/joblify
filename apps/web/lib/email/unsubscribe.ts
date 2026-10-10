import { createHmac } from 'node:crypto';
import { safeEqual } from '@/lib/security/timing-safe';

/**
 * Stateless unsubscribe tokens.
 *
 * Every marketing email must carry a working, no-login unsubscribe (CAN-SPAM,
 * ePrivacy/GDPR art. 21, and the one-click rules — RFC 8058 — that Gmail,
 * Yahoo and Microsoft enforce on bulk senders). The token is
 * `<userId>.<HMAC(userId)>`: the link works without a session, cannot be
 * forged without the server secret, and needs no table. It does not expire —
 * an unsubscribe link in an old email should keep working.
 *
 * The token grants exactly one capability: switching OFF that user's digest.
 * It can never opt anyone in, so a leaked link cannot be used to subscribe a
 * victim.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function secret(): string | null {
  // A dedicated secret is preferred; CRON_SECRET is already required in
  // production, so falling back to it keeps the feature working without one
  // more variable to forget.
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || null;
}

function mac(userId: string, key: string): string {
  return createHmac('sha256', key).update(`joblify:unsubscribe:v1:${userId}`).digest('base64url');
}

export function signUnsubscribeToken(userId: string): string | null {
  const key = secret();
  if (!key || !UUID.test(userId)) return null;
  return `${userId}.${mac(userId, key)}`;
}

/** The user id the token was issued for, or null if it is malformed/forged. */
export function verifyUnsubscribeToken(token: string): string | null {
  const key = secret();
  if (!key) return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!UUID.test(userId)) return null;
  return safeEqual(signature, mac(userId, key)) ? userId : null;
}

/** Absolute one-click unsubscribe URL, or null when it cannot be built safely. */
export function unsubscribeUrl(
  userId: string,
  siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): string | null {
  const token = signUnsubscribeToken(userId);
  if (!token || !siteUrl || !/^https?:\/\//.test(siteUrl)) return null;
  return `${siteUrl.replace(/\/+$/, '')}/api/v1/email/unsubscribe?t=${encodeURIComponent(token)}`;
}

/**
 * Whether marketing mail can be sent at all. Without a signing secret and an
 * absolute site URL there is no way to honour the unsubscribe requirement, so
 * senders must refuse rather than send mail the recipient cannot opt out of.
 */
export function canSendWithUnsubscribe(): boolean {
  return unsubscribeUrl('00000000-0000-4000-8000-000000000000') !== null;
}
