import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/app/components/ui/ambient';
import { Badge } from '@/app/components/ui/badge';
import { buttonClasses } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Stat, StatRow } from '@/app/components/ui/stat';
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from './job-status';

export const metadata = { title: 'My job posts' };

export default async function CompanyJobsPage() {
  const user = await requireRole('COMPANY');
  const jobs = await db.jobPost.findMany({
    where: { companyId: user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { applications: true } } },
  });

  // Dashboard stat strip, derived purely from the rows fetched above — no
  // extra queries.
  const openJobs = jobs.filter((j) => j.status === 'PUBLISHED').length;
  const totalApplicants = jobs.reduce((sum, j) => sum + j._count.applications, 0);

  return (
    <main>
      <PageHeader
        eyebrow="For employers"
        title="My job posts"
        width="max-w-5xl"
        actions={
          <Link href="/company/jobs/new" className={`${buttonClasses('primary')} no-underline`}>
            Post a job
          </Link>
        }
      />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {jobs.length === 0 ? (
        <p className="text-neutral-600">
          You haven&apos;t posted any jobs yet.{' '}
          <Link href="/company/jobs/new" className="text-indigo-700 hover:underline">
            Post your first job
          </Link>
          .
        </p>
      ) : (
        <>
          <Card className="mb-8 p-6">
            <StatRow>
              <Stat value={openJobs} label="Open jobs" />
              <Stat value={totalApplicants} label="Total applicants" />
              <Stat value={jobs.length - openJobs} label="Not published" />
            </StatRow>
          </Card>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200/80 bg-white shadow-soft">
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
                      <Badge tone={JOB_STATUS_TONE[j.status]}>{JOB_STATUS_LABEL[j.status]}</Badge>
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
        </>
      )}
      </div>
    </main>
  );
}
