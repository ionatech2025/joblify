import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/observability/logger';


const ConsentSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean().optional(),
});

// Mirrors the cookie-banner choice to User.consentJson for the compliance
// record. The client cookie is the source of truth for gating scripts; this is
// the durable audit of what the user chose. No-op when signed out.
export async function POST(req: Request) {
  const parsed = ConsentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  const user = await currentUser();
  if (user) {
    await db.user.update({
      where: { id: user.id },
      data: {
        consentJson: {
          analytics: parsed.data.analytics,
          marketing: parsed.data.marketing ?? false,
          updatedAt: new Date().toISOString(),
        },
      },
    });
    logger.info({ userId: user.id, analytics: parsed.data.analytics }, 'consent updated');
  }

  return NextResponse.json({ ok: true });
}
