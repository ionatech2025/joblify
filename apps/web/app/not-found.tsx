import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="m-0 text-5xl font-extrabold text-neutral-900">404</h1>
      <p className="mt-2 text-neutral-600">We couldn&apos;t find that page.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/jobs"
          className="rounded-lg bg-neutral-900 px-5 py-2.5 font-semibold text-white no-underline transition-colors hover:bg-neutral-700"
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
    </main>
  );
}
