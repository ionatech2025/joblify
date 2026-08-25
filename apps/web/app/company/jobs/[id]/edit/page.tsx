import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { EditJobForm } from './edit-job-form';
import type { PostJobFormValues } from '@/app/company/jobs/job-form-schema';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel, RecordPager } from '@/app/components/console/control-panel';
import { buttonClasses } from '@/app/components/ui/button';

export const metadata = { title: 'Edit job' };

export default async function EditJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ just_posted?: string }>;
}) {
  const user = await requireRole('COMPANY');
  const { id } = await params;
  const sp = await searchParams;

  const [job, siblings] = await Promise.all([
    db.jobPost.findFirst({
      where: { id, companyId: user.id, deletedAt: null },
      include: { chatArea: { select: { id: true } }, _count: { select: { applications: true } } },
    }),
    // Same order as the jobs list default, so the pager walks the pipeline in
    // the order the recruiter last saw it.
    db.jobPost.findMany({
      where: { companyId: user.id, deletedAt: null },
      orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      select: { id: true },
    }),
  ]);
  if (!job) notFound();

  const initial: PostJobFormValues = {
    title: job.title,
    description: job.description,
    requirements: job.requirements ?? '',
    industry: job.industry,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    workMode: job.workMode,
    location: job.location ?? '',
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    applicationDeadline: job.applicationDeadline
      ? job.applicationDeadline.toISOString().slice(0, 10)
      : '',
    publish: job.status === 'PUBLISHED',
    createChatArea: !!job.chatArea,
  };

  const position = siblings.findIndex((s) => s.id === id);
  const siblingHref = (index: number) => {
    const sib = siblings[index]?.id;
    return sib ? `/company/jobs/${sib}/edit` : undefined;
  };

  return (
    <main>
      <ControlPanel
        breadcrumb={
          <Breadcrumb items={[{ label: 'Jobs', href: '/company/jobs' }, { label: job.title }]} />
        }
        pager={
          position >= 0 && siblings.length > 1 ? (
            <RecordPager
              index={position + 1}
              total={siblings.length}
              label="job"
              prevHref={siblingHref(position - 1)}
              nextHref={siblingHref(position + 1)}
            />
          ) : undefined
        }
        actions={
          <>
            <Link
              href={`/company/applicants/${job.id}`}
              className={`${buttonClasses('secondary', 'sm')} no-underline`}
            >
              <Users aria-hidden className="size-3.5" />
              Applicants ({job._count.applications})
            </Link>
            {job.status === 'PUBLISHED' ? (
              <Link
                href={`/jobs/${job.slug}`}
                className={`${buttonClasses('ghost', 'sm')} no-underline`}
              >
                View public page
                <ExternalLink aria-hidden className="size-3.5" />
              </Link>
            ) : null}
          </>
        }
      />
      <ConsoleWidth className="max-w-5xl py-3">
        {sp.just_posted && (
          <p className="rounded-card bg-success-subtle text-success-subtle-fg border-success/25 mb-3 border px-3 py-2 text-[13px]">
            Job posted — it&apos;s live on /jobs and indexed within a minute.
          </p>
        )}
        {/* The old "Current status: X. Saving re-extracts skills…" paragraph is
            gone: the statusbar in the sheet states the status, and the skills
            note now sits on the Options tab next to the field it describes. */}
        <EditJobForm jobId={job.id} initial={initial} status={job.status} />
      </ConsoleWidth>
    </main>
  );
}
