import type { Metadata } from 'next';
import Link from 'next/link';
import { AmbientCanvas } from '@/app/components/ui/ambient';

export const metadata: Metadata = { title: 'Offline', robots: { index: false } };

// Static fallback served by the service worker when a navigation fails offline.
export default function OfflinePage() {
  return (
    <main className="relative overflow-hidden px-4 py-24 sm:px-6">
      <AmbientCanvas variant="hero" />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark */}
      <img src="/logo.png" alt="" width={56} height={56} className="size-14 rounded-xl" />
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-neutral-900">You&rsquo;re offline</h1>
      <p className="mt-2 text-neutral-600">
        Joblify can&rsquo;t reach the network right now. Check your connection and try again — pages
        you&rsquo;ve already visited may still be available.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white no-underline transition-colors hover:bg-indigo-700"
      >
        Go to homepage
      </Link>
      </div>
    </main>
  );
}
