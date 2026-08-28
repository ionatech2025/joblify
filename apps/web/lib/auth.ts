import { cache } from 'react';
import { auth as clerkAuth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { User, UserType, PlanTier } from '@prisma/client';
import { db } from './db';

// Auth helpers. `currentUser()` is the canonical way to fetch the local user
// from inside Server Components / Server Actions / Route Handlers.

export type AuthContext = User;

/**
 * Request-scoped memo of the local user row.
 *
 * Every gate in a route calls this independently — the (authenticated) layout's
 * Gate, then the jobseeker/company sub-layout, then the page's own
 * requireRole() — and layouts resolve before their children, so without the
 * memo those are three *sequential* round trips to Neon for the identical
 * `where: { clerkUserId }` lookup. React's cache() dedupes them to one per
 * request; the entry is discarded when the request ends, so nothing leaks
 * between users.
 *
 * clerkAuth() is already request-deduped by Clerk itself — the Prisma read was
 * the part paying the cost.
 */
export const currentUser = cache(async function currentUser(): Promise<AuthContext | null> {
  const { userId: clerkUserId } = await clerkAuth();
  if (!clerkUserId) return null;

  const existing = await db.user.findUnique({ where: { clerkUserId } });
  if (existing) return existing.deletedAt ? null : existing;

  // No mirrored row yet — the Clerk→Postgres webhook may lag, fail, or not have
  // existed when this account signed up. Lazily provision from Clerk so the
  // first authenticated request works instead of redirecting to /sign-in, which
  // would loop forever (Clerk sees a signed-in user and bounces back). The
  // webhook upsert remains the primary mirror path.
  return provisionFromClerk(clerkUserId);
});

async function provisionFromClerk(clerkUserId: string): Promise<AuthContext | null> {
  const cu = await clerkCurrentUser();
  const email = cu?.primaryEmailAddress?.emailAddress ?? cu?.emailAddresses?.[0]?.emailAddress;
  if (!cu || !email) return null;

  try {
    return await db.user.create({
      data: {
        clerkUserId,
        email,
        firstName: cu.firstName ?? null,
        lastName: cu.lastName ?? null,
        avatarUrl: cu.imageUrl ?? null,
      },
    });
  } catch {
    // Lost a race with the webhook (or the email is already mirrored) — re-read.
    const user = await db.user.findUnique({ where: { clerkUserId } });
    return user && !user.deletedAt ? user : null;
  }
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

// Entitlement gate. Takes an already-fetched user (from requireUser/
// requireRole) instead of re-querying — every gated action already has one.
// Every account defaults to PRO (see PlanTier in schema.prisma), so this is
// currently a no-op everywhere it's called; it exists so the use-case spec's
// premium boundaries (chat creation, the shortlist auto-join, application
// tracking, company outreach actions) have one real, load-bearing check
// point ready for whenever a FREE tier and billing exist.
export function assertPlan(user: AuthContext, minPlan: PlanTier): void {
  if (minPlan === 'PRO' && user.plan !== 'PRO') {
    throw new PlanError('UPGRADE_REQUIRED');
  }
}

export class PlanError extends Error {
  constructor(public code: 'UPGRADE_REQUIRED') {
    super(code);
    this.name = 'PlanError';
  }
}
