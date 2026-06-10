import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from './providers';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { CookieBanner } from './components/cookie-banner';
import { AnalyticsGate } from './components/analytics-gate';
import { SwRegister } from './components/sw-register';
import { AmbientCanvas } from './components/ui/ambient';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Joblify — Find your next role', template: '%s · Joblify' },
  description: 'A job marketplace for jobseekers and companies.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  applicationName: 'Joblify',
  appleWebApp: { capable: true, title: 'Joblify', statusBarStyle: 'default' },
  icons: { apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ClerkProvider reads request headers (keyless status + auth), which is
  // uncached. Under cacheComponents that access must sit inside a Suspense
  // boundary, so the static <html>/<body> shell can prerender while the auth
  // context streams in.
  return (
    <html lang="en">
      <body>
        {/* App-wide ambient backdrop (faint 'page' variant). Fixed + -z-10 so
            every section — header, main, footer — sits on the same canvas as
            glass/white surfaces. body is transparent (globals.css). */}
        <div aria-hidden="true" className="fixed inset-0 -z-10">
          <AmbientCanvas variant="page" />
        </div>
        <SwRegister />
        {/* Reserve the header height so the Clerk-gated header streaming in
            doesn't push content down (avoids layout shift). */}
        <Suspense fallback={<div className="h-14 border-b border-indigo-100 bg-white/70 backdrop-blur" />}>
          {/* colorPrimary matches the app's indigo accent so Clerk's widgets
              (sign-in/up card, UserButton) render on-palette. */}
          <ClerkProvider appearance={{ variables: { colorPrimary: '#4f46e5' } }}>
            <Header />
            <Providers>{children}</Providers>
            <Footer />
            <CookieBanner />
            <AnalyticsGate />
          </ClerkProvider>
        </Suspense>
      </body>
    </html>
  );
}
