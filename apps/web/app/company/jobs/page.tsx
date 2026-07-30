import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { Briefcase } from 'lucide-react';
import { PageHeader } from '@/app/components/ui/ambient';
import { EmptyState } from '@/app/components/ui/empty-state';
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
          <EmptyState
            icon={<Briefcase />}
            title="No job posts yet"
            description="Publish a role and it appears in search, on your company page, and in seekers' matches."
            action={
              <Link href="/company/jobs/new" className={`${buttonClasses()} no-underline`}>
                Post your first job
              </Link>
            }
          />
        ) : (
          <>
            <Card className="mb-8 p-6">
              <StatRow>
                <Stat value={openJobs} label="Open jobs" />
                <Stat value={totalApplicants} label="Total applicants" />
                <Stat value={jobs.length - openJobs} label="Not published" />
              </StatRow>
            </Card>
            <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-soft">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-left text-fg-muted">
                    <th className="px-4 py-2 font-medium">Title</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Applicants</th>
                    <th className="px-4 py-2 font-medium">Posted</th>
                    <th className="px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/jobs/${j.slug}`}
                          className="font-medium text-fg hover:underline"
                        >
                          {j.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={JOB_STATUS_TONE[j.status]}>{JOB_STATUS_LABEL[j.status]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/company/applicants/${j.id}`}
                          className="text-brand hover:underline"
                        >
                          {j._count.applications}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-fg-muted">
                        {(j.publishedAt ?? j.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/company/jobs/${j.id}/edit`}
                          className="text-brand hover:underline"
                        >
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
