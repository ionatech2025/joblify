import { PageHeader } from '@/app/components/ui/ambient';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <main>
      <PageHeader title="About Joblify" width="max-w-3xl" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-lg text-neutral-600">
          Joblify is a job marketplace built to connect jobseekers with vetted companies — fast search,
          one-click applications with an AI-parsed résumé, and a transparent pipeline for both sides.
        </p>
      </div>
    </main>
  );
}
