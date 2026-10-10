'use server';

import { headers } from 'next/headers';
import { requireRole } from '@/lib/auth';
import { withAudit } from '@/lib/audit';
import { logger } from '@/lib/observability/logger';
import { clientIp } from '@/lib/security/client-ip';
import { type ActionResult, fail, succeed } from '@/lib/action-result';

/**
 * Turn the daily jobs digest on or off for the signed-in job seeker.
 *
 * This is the only place email consent is *granted*. Turning it on is an
 * explicit act taken from the notifications page; the cookie banner never
 * implies it (it used to), and the one-click unsubscribe can only switch it
 * back off. Both directions are audited with the consent timestamp, so the
 * controller can demonstrate when and how consent was given (GDPR art. 7(1)).
 */
export async function setDigestOptIn(optIn: boolean): Promise<ActionResult<boolean>> {
  const user = await requireRole('JOB_SEEKER');

  if (typeof optIn !== 'boolean') return fail('Invalid request.');

  // An address that hard-bounced or filed a complaint is suppressed; enabling
  // the digest would silently do nothing, which is worse than saying so.
  if (optIn && user.emailSuppressedAt) {
    return fail(
      'We cannot send email to this address because earlier messages bounced or were marked as spam. Update your email in your account settings first.',
    );
  }

  if (user.digestOptIn === optIn) return succeed(optIn);

  const h = await headers();
  await withAudit(
    { actorId: user.id, ip: clientIp(h), ua: h.get('user-agent') },
    {
      action: 'CONSENT_UPDATED',
      entity: 'user',
      entityId: user.id,
      before: { digestOptIn: user.digestOptIn },
      after: () => ({ digestOptIn: optIn, via: 'settings' }),
    },
    (tx) =>
      tx.user.update({
        where: { id: user.id },
        data: { digestOptIn: optIn, digestOptInAt: optIn ? new Date() : null },
      }),
  );

  logger.info({ userId: user.id, digestOptIn: optIn }, 'digest preference updated');
  return succeed(optIn);
}
