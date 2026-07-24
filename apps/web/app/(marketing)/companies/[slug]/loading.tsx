// Mirrors the page's own Suspense fallback. Sitting above the page, it also
// gives the route a Suspense boundary over its `await params`, so the static
// shell (with this skeleton in the hole) can prerender under cacheComponents.
export default function CompanyDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="h-8 w-1/2 animate-pulse rounded bg-neutral-200" />
    </main>
  );
}
