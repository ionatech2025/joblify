import Link from 'next/link';
import { AmbientCanvas } from '@/app/components/ui/ambient';
import { buttonClasses } from '@/app/components/ui/button';

export default function NotFound() {
  return (
    <main className="relative overflow-hidden px-4 py-20 sm:py-24">
      <AmbientCanvas variant="hero" />
      <div className="relative mx-auto max-w-xl text-center">
        <p className="eyebrow m-0">Page not found</p>
        <h1 className="display m-0 mt-3 text-6xl text-neutral-900 sm:text-7xl">404</h1>
        <p className="mt-3 text-neutral-600">We couldn&apos;t find that page.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={`${buttonClasses('primary', 'lg')} no-underline`}>
            Go home
          </Link>
          <Link href="/jobs" className={`${buttonClasses('secondary', 'lg')} no-underline`}>
            Browse jobs
          </Link>
        </div>
      </div>
    </main>
  );
}
