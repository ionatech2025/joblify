import type { Metadata, Viewport } from 'next';
import { ClerkClientProvider } from './components/clerk-provider';
import { Providers } from './providers';
import { Header } from './components/header';
import { HeaderAuth } from './components/header-auth';
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
  // ClerkClientProvider is a pure context provider (see its module comment) —
  // it never reads the request, so nothing here may wrap the whole tree in a
  // Suspense boundary that would collapse every route's static shell to a
  // fallback. The only session-dependent server read at layout scope is the
  // header's auth island (<HeaderAuth>), which suspends on its own; pages
  // stream their own dynamic holes.
  return (
    <html lang="en">
      <body>
        {/* First focusable element on every page: lets keyboard/AT users jump
            past the chrome straight to the page content. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {/* App-wide ambient backdrop (faint 'page' variant). Fixed + -z-10 so
            every section — header, main, footer — sits on the same canvas as
            glass/white surfaces. body is transparent (globals.css). */}
        <div aria-hidden="true" className="fixed inset-0 -z-10">
          <AmbientCanvas variant="page" />
        </div>
        <SwRegister />
        <ClerkClientProvider>
          <Header auth={<HeaderAuth />} />
          <Providers>
            <div id="main-content" tabIndex={-1} className="focus:outline-none">
              {children}
            </div>
          </Providers>
          <Footer />
          <CookieBanner />
          <AnalyticsGate />
        </ClerkClientProvider>
      </body>
    </html>
  );
}
