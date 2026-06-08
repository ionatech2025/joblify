import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from './providers';
import { CookieBanner } from './components/cookie-banner';
import { AnalyticsGate } from './components/analytics-gate';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Joblify — Find your next role', template: '%s · Joblify' },
  description: 'A job marketplace for jobseekers and companies.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ClerkProvider reads request headers (keyless status + auth), which is
  // uncached. Under cacheComponents that access must sit inside a Suspense
  // boundary, so the static <html>/<body> shell can prerender while the auth
  // context streams in.
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <ClerkProvider>
            <Providers>{children}</Providers>
            <CookieBanner />
            <AnalyticsGate />
          </ClerkProvider>
        </Suspense>
      </body>
    </html>
  );
}
