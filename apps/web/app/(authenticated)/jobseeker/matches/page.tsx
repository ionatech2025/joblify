import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { getRecommendedJobs } from '@/lib/search/semantic-match';
import { PageHeader } from '@/app/components/ui/ambient';
import { Badge } from '@/app/components/ui/badge';

export const metadata = { title: 'Matches' };

export default async function JobMatchesPage() {
  const user = await requireRole('JOB_SEEKER');
  const jobs = await getRecommendedJobs(user.id);

  return (
    <main>
      <PageHeader
        eyebrow="For you"
        title="Matches"
        subtitle="Jobs ranked by how closely they match your resume — not just keywords, the whole picture."
        width="max-w-3xl"
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {jobs.length === 0 ? (
          <p className="mt-6 text-neutral-500">
            No matches yet.{' '}
            <Link href="/jobseeker/resumes" className="text-indigo-600 hover:underline">
              Upload or build a resume
            </Link>{' '}
            and check back once it's processed.
          </p>
        ) : (
          <ul className="mt-6 flex list-none flex-col gap-3 p-0">
            {jobs.map((j) => (
              <li
                key={j.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-soft"
              >
                <Link href={`/jobs/${j.slug}`} className="min-w-0 text-neutral-900 no-underline">
                  <strong>{j.title}</strong>
                  <span className="text-neutral-600">
                    {' — '}
                    {j.companyName}
                    {j.location ? ` · ${j.location}` : ''}
                  </span>
                </Link>
                <Badge tone={j.similarity >= 0.7 ? 'success' : 'neutral'} className="shrink-0">
                  {Math.round(j.similarity * 100)}% match
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
