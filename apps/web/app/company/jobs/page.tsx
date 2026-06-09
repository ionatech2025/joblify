import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

export const metadata = { title: 'My job posts' };

export default async function CompanyJobsPage() {
  const user = await requireRole('COMPANY');
  const jobs = await db.jobPost.findMany({
    where: { companyId: user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { applications: true } } },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="m-0 text-2xl font-bold text-neutral-900">My job posts</h1>
        <Link
          href="/company/jobs/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Post a job
        </Link>
      </header>

      {jobs.length === 0 ? (
        <p className="text-neutral-600">
          You haven&apos;t posted any jobs yet.{' '}
          <Link href="/company/jobs/new" className="text-indigo-700 hover:underline">
            Post your first job
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-600">
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Applicants</th>
                <th className="px-4 py-2 font-medium">Posted</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${j.slug}`} className="font-medium text-neutral-900 hover:underline">
                      {j.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/company/applicants/${j.id}`} className="text-indigo-700 hover:underline">
                      {j._count.applications}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{(j.publishedAt ?? j.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/company/jobs/${j.id}/edit`} className="text-indigo-700 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
