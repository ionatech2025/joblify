import { Resend } from 'resend';
import { db } from '@/lib/db';

let _resend: Resend | null = null;

export function resend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not set');
  _resend = new Resend(key);
  return _resend;
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Joblify <noreply@joblify.example>';

// True if the address bounced or filed a complaint. Transactional callers should
// skip sending to suppressed recipients; bulk senders filter at the query level.
//
// findFirst, not findUnique: email is only unique among active rows (a
// soft-deleted user can share an email with the active one who now owns it —
// see the users_email_partial_unique migration), so it's no longer a
// schema-level unique field. deletedAt: null pins this to the active owner,
// which is the only account callers here ever mean.
export async function isEmailSuppressed(email: string): Promise<boolean> {
  const u = await db.user.findFirst({
    where: { email, deletedAt: null },
    select: { emailSuppressedAt: true },
  });
  return Boolean(u?.emailSuppressedAt);
}
