import type { Metadata } from 'next';
import Link from 'next/link';
import { AmbientCanvas } from '@/app/components/ui/ambient';
import { buttonClasses } from '@/app/components/ui/button';

export const metadata: Metadata = { title: 'Offline', robots: { index: false } };

// Static fallback served by the service worker when a navigation fails offline.
export default function OfflinePage() {
  return (
    <main className="relative overflow-hidden px-4 py-24 sm:px-6">
      <AmbientCanvas variant="hero" />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
        <img src="/logo.png" alt="" width={56} height={56} className="size-14 rounded-control" />
        <p className="eyebrow m-0 mt-6">Offline</p>
        <h1 className="display m-0 mt-3 text-3xl text-fg sm:text-4xl">You&rsquo;re offline</h1>
        <p className="mt-3 text-fg-muted">
          Joblify can&rsquo;t reach the network right now. Check your connection and try again —
          pages you&rsquo;ve already visited may still be available.
        </p>
        <Link href="/" className={`${buttonClasses('primary', 'lg')} mt-8 no-underline`}>
          Go to homepage
        </Link>
      </div>
    </main>
  );
}
