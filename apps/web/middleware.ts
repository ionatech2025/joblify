import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Route gates
const isProtected = createRouteMatcher([
  '/dashboard(.*)',
  '/jobseeker(.*)',
  '/company(.*)',
  '/account(.*)',
  '/employer-setup(.*)',
  '/onboarding(.*)',
  // Admin authorization is enforced in app/admin/page.tsx (User.userType),
  // same as company — gated on userType, not a Clerk org role, for V1 (see
  // the company note below). The previous org:admin check required Clerk
  // Organizations, which nothing in this app ever provisions, making /admin
  // unreachable by any account.
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect();
  }
  // Company authorization is enforced in company/layout.tsx (User.userType) and
  // each company Server Action (requireRole). Self-serve companies are gated on
  // userType, not a Clerk org role, for V1 — orgs/MFA can layer on later.

  const response = NextResponse.next();
  // No-index API + dashboards; default-index everything else.
  if (req.nextUrl.pathname.startsWith('/api') || isProtected(req)) {
    response.headers.set('X-Robots-Tag', 'noindex');
  }
  return response;
});

export const config = {
  matcher: [
    // Skip Next internals and anything that looks like a static file, matched
    // by extension. The previous pattern named only _next/static, _next/image
    // and three files, which left every other public asset going through Clerk
    // first: /logo.png (preloaded as an image on every page, so the highest
    // priority image on the document took an auth hop), /sw.js, the PWA icons
    // and /manifest.webmanifest. None of them need a session, and each one cost
    // an edge invocation.
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|webp|avif|ico|ttf|woff2?|txt|xml|webmanifest|map)).*)',
    // Always run on API routes.
    '/(api|trpc)(.*)',
  ],
};
