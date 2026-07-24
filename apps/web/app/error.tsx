'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { AmbientCanvas } from '@/app/components/ui/ambient';
import { buttonClasses } from '@/app/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="relative overflow-hidden px-4 py-20 sm:py-24">
      <AmbientCanvas variant="hero" />
      <div className="relative mx-auto max-w-xl text-center">
        <p className="eyebrow m-0">Error</p>
        <h1 className="display m-0 mt-3 text-3xl text-neutral-900 sm:text-4xl">Something went wrong</h1>
        <p className="mt-3 text-neutral-600">An unexpected error occurred. You can try again, or head back home.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className={buttonClasses('primary', 'lg')}>
            Try again
          </button>
          <Link href="/" className={`${buttonClasses('secondary', 'lg')} no-underline`}>
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
