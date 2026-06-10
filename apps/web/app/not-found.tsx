import Link from 'next/link';
import { AmbientCanvas } from '@/app/components/ui/ambient';

export default function NotFound() {
  return (
    <main className="relative overflow-hidden px-4 py-16">
      <AmbientCanvas variant="hero" />
      <div className="relative mx-auto max-w-xl text-center">
      <h1 className="m-0 text-5xl font-extrabold text-neutral-900">404</h1>
      <p className="mt-2 text-neutral-600">We couldn&apos;t find that page.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/jobs"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white no-underline transition-colors hover:bg-indigo-700"
        >
          Browse jobs
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 font-semibold text-neutral-900 no-underline transition-colors hover:bg-neutral-50"
        >
          Go home
        </Link>
      </div>
      </div>
    </main>
  );
}
