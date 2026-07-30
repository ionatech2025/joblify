import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const rows = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(
    rows.map((n) => ({
      id: n.id,
      kind: n.kind,
      payload: n.payload,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
  );
}
