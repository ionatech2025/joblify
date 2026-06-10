import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Route gates
const isProtected = createRouteMatcher([
  '/dashboard(.*)',
  '/jobseeker(.*)',
  '/company(.*)',
  '/account(.*)',
  '/employer-setup(.*)',
]);

const isAdminOnly = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect();
  }
  // Company authorization is enforced in company/layout.tsx (User.userType) and
  // each company Server Action (requireRole). Self-serve companies are gated on
  // userType, not a Clerk org role, for V1 — orgs/MFA can layer on later.
  if (isAdminOnly(req)) {
    await auth.protect((has) => has({ role: 'org:admin' }));
  }

  const response = NextResponse.next();
  // No-index API + dashboards; default-index everything else.
  if (req.nextUrl.pathname.startsWith('/api') || isProtected(req)) {
    response.headers.set('X-Robots-Tag', 'noindex');
  }
  return response;
});

export const config = {
  matcher: [
    // Skip static files and Next internals.
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
    // Always run on API routes.
    '/(api|trpc)(.*)',
  ],
};
