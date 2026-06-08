import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Route gates
const isProtected = createRouteMatcher([
  '/dashboard(.*)',
  '/jobseeker(.*)',
  '/company(.*)',
  '/account(.*)',
]);

const isCompanyOnly = createRouteMatcher(['/company(.*)']);
const isAdminOnly = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect();
  }
  if (isCompanyOnly(req)) {
    await auth.protect((has) => has({ role: 'org:company' }));
  }
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
