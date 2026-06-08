export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-neutral-900">About Joblify</h1>
      <p className="mt-4 text-lg text-neutral-600">
        Joblify is a job marketplace built to connect jobseekers with vetted companies — fast search,
        one-click applications with an AI-parsed résumé, and a transparent pipeline for both sides.
      </p>
    </main>
  );
}
