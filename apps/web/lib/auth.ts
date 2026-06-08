import { auth as clerkAuth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { User, UserType } from '@prisma/client';
import { db } from './db';

// Auth helpers. `currentUser()` is the canonical way to fetch the local user
// from inside Server Components / Server Actions / Route Handlers.

export type AuthContext = User;

export async function currentUser(): Promise<AuthContext | null> {
  const { userId: clerkUserId } = await clerkAuth();
  if (!clerkUserId) return null;

  const user = await db.user.findUnique({
    where: { clerkUserId },
  });
  if (!user || user.deletedAt) return null;
  return user;
}

export async function requireUser(): Promise<AuthContext> {
  const user = await currentUser();
  if (!user) redirect('/sign-in');
  return user;
}

export async function requireRole(role: UserType): Promise<AuthContext> {
  const user = await requireUser();
  if (user.userType !== role) throw new AuthError('FORBIDDEN');
  return user;
}

export async function requireSelfOrAdmin(targetUserId: string): Promise<AuthContext> {
  const user = await requireUser();
  if (user.id !== targetUserId && user.userType !== 'ADMIN') {
    throw new AuthError('FORBIDDEN');
  }
  return user;
}

export class AuthError extends Error {
  constructor(public code: 'UNAUTHENTICATED' | 'FORBIDDEN') {
    super(code);
    this.name = 'AuthError';
  }
}
