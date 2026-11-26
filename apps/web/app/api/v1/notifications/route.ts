import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { loadNotifications } from '@/lib/notifications/load';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  return NextResponse.json(await loadNotifications(user.id), {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
