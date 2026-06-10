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
export async function isEmailSuppressed(email: string): Promise<boolean> {
  const u = await db.user.findUnique({
    where: { email },
    select: { emailSuppressedAt: true },
  });
  return Boolean(u?.emailSuppressedAt);
}
