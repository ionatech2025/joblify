import type { Metadata, Viewport } from 'next';
import { Archivo, Inter } from 'next/font/google';
import { ClerkClientProvider } from './components/clerk-provider';
import { ThemeScript } from './components/theme-script';
import { Providers } from './providers';
import { Header } from './components/header';
import { HeaderAuth } from './components/header-auth';
import { Footer } from './components/footer';
import { CookieBanner } from './components/cookie-banner';
import { AnalyticsGate } from './components/analytics-gate';
import { SwRegister } from './components/sw-register';
import { AmbientCanvas } from './components/ui/ambient';
import { Toaster } from './components/ui/toaster';
import { CommandPalette } from './components/command-palette';
import './globals.css';

// Self-hosted at build time by next/font — no request to fonts.googleapis.com
// at runtime, so the `font-src 'self' data:` CSP in next.config.ts stands.
// Both are variable fonts (one file per family, full weight axis), and
// next/font emits a metric-matched local fallback so swapping costs no CLS.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Archivo carries the editorial display weight. The previous system-stack +
// font-weight:900 approach rendered as Arial Black on Windows and Roboto on
// Android, which is what made the headlines read generic off-macOS.
const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

/**
 * Clerk's frontend API origin, decoded from the publishable key (which encodes
 * the host, base64, after the pk_test_/pk_live_ prefix). Derived rather than
 * hardcoded so it follows the dev -> production instance switch on its own.
 *
 * It earns a preconnect because clerk-js is a render-blocking dependency of the
 * thing people came to /sign-up to use: the sign-up card cannot paint until an
 * 88 KB script arrives from an origin the browser has otherwise never seen, and
 * that origin is only discovered when React hydrates and mounts ClerkProvider.
 * The hint moves DNS + TCP + TLS to the start of the document instead.
 */
function clerkFrontendOrigin(): string | null {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return null;
  try {
    const host = atob(key.replace(/^pk_(test|live)_/, '')).replace(/\$$/, '');
    return /^[a-z0-9.-]+$/i.test(host) ? `https://${host}` : null;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: { default: 'Joblify — Find your next role', template: '%s · Joblify' },
  description: 'A job marketplace for jobseekers and companies.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  applicationName: 'Joblify',
  appleWebApp: { capable: true, title: 'Joblify', statusBarStyle: 'default' },
  icons: { apple: '/apple-touch-icon.png' },
  // Per-page opengraph-image.tsx (job posts, company profiles) supplies its
  // own `images`; everything else inherits app/opengraph-image.tsx via the
  // filesystem convention, so no `images` array is set here. `siteName` and
  // `locale` are what WhatsApp/Facebook show as the small caption line above
  // the title on a shared card — worth setting even though nothing here
  // overrides the image, since the whole openGraph object is otherwise
  // absent as of today (checked before this change).
  openGraph: {
    siteName: 'Joblify',
    locale: 'en_US',
    type: 'website',
  },
  // WhatsApp's own preview crawler reads Open Graph tags, not Twitter Card
  // ones — but Slack, Discord, and X/Twitter's crawlers prefer this block
  // when both are present, so both stay in sync rather than relying on a
  // fallback chain.
  twitter: {
    card: 'summary_large_image',
  },
};

// Per-scheme browser chrome. Must track --canvas in globals.css.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#08080a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkOrigin = clerkFrontendOrigin();

  // ClerkClientProvider is a pure context provider (see its module comment) —
  // it never reads the request, so nothing here may wrap the whole tree in a
  // Suspense boundary that would collapse every route's static shell to a
  // fallback. The only session-dependent server read at layout scope is the
  // header's auth island (<HeaderAuth>), which suspends on its own; pages
  // stream their own dynamic holes.
  return (
    // suppressHydrationWarning: ThemeScript sets the `dark` class on <html>
    // before React hydrates, so the server and client class lists differ by
    // design on a dark-theme load.
    <html lang="en" className={`${inter.variable} ${archivo.variable}`} suppressHydrationWarning>
      <body>
        {/* React hoists these into <head>. dns-prefetch is the fallback for the
            handful of browsers that ignore preconnect. */}
        {clerkOrigin && (
          <>
            <link rel="preconnect" href={clerkOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={clerkOrigin} />
          </>
        )}
        {/* Must stay the first child of <body> — it runs before anything below
            is painted, which is what prevents a flash of the wrong theme. */}
        <ThemeScript />
        {/* First focusable element on every page: lets keyboard/AT users jump
            past the chrome straight to the page content. */}
        <a
          href="#main-content"
          className="focus:bg-ink focus:text-ink-fg sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
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
          {/* Global overlays. Both are client islands that render null until
              opened/populated, so they cost nothing to the static shell. */}
          <CommandPalette />
          <Toaster />
        </ClerkClientProvider>
      </body>
    </html>
  );
}
