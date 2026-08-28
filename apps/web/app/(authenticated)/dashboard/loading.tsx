// /dashboard renders nothing — it reads the account's role and redirects. The
// group-level fallback stood in a control panel and eight list rows for it,
// so the one page in the app guaranteed never to show content was the one
// promising the most. This says what is actually happening instead.
export default function Loading() {
  return (
    <main className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-fg-muted m-0 text-sm" role="status">
        Taking you to your workspace…
      </p>
    </main>
  );
}
