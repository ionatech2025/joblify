import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { VerificationQueue } from './verification-queue';
import { JobReportsQueue } from './job-reports';

export const metadata = { title: 'Admin' };

export default async function AdminPage() {
  await requireRole('ADMIN');

  const [pending, reports, jobSeekerCount, companyCount, publishedJobCount] = await Promise.all([
    db.companyProfile.findMany({
      where: { verificationStatus: 'PENDING' },
      // Oldest first, so a ceiling here trims the newest arrivals rather than
      // the ones that have been waiting longest.
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: {
        id: true,
        companyName: true,
        industry: true,
        companySize: true,
        website: true,
        createdAt: true,
      },
    }),
    db.jobReport.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: {
        id: true,
        reason: true,
        details: true,
        createdAt: true,
        jobPost: {
          select: {
            title: true,
            slug: true,
            company: { select: { companyProfile: { select: { companyName: true } } } },
          },
        },
      },
    }),
    db.user.count({ where: { userType: 'JOB_SEEKER', deletedAt: null } }),
    db.user.count({ where: { userType: 'COMPANY', deletedAt: null } }),
    db.jobPost.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
  ]);

  return (
    <main>
      <ControlPanel
        breadcrumb={<Breadcrumb items={[{ label: 'Company verification' }]} />}
        // Platform totals as control-panel context rather than a stat card
        // above the queue: they are reference figures, not the work on the page.
        pager={
          <dl className="text-fg-muted m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
            <Metric label="Jobseekers" value={jobSeekerCount} />
            <Metric label="Companies" value={companyCount} />
            <Metric label="Published jobs" value={publishedJobCount} />
          </dl>
        }
      />
      <ConsoleWidth className="max-w-6xl py-3">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <div>
            <h2 className="text-fg text-[14px] font-semibold">Pending company verifications</h2>
            <p className="text-fg-muted text-[12px]">
              Unverified companies don&apos;t appear in the public directory or job search.
            </p>
          </div>
          <span className="text-fg-muted text-[12px] font-semibold tabular-nums">
            {pending.length} pending
          </span>
        </div>
        <VerificationQueue
          initial={pending.map((p) => ({
            id: p.id,
            companyName: p.companyName,
            industry: p.industry,
            companySize: p.companySize,
            website: p.website,
            createdAt: p.createdAt.toISOString(),
          }))}
        />

        <div className="mt-6 mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-fg text-[14px] font-semibold">Reported job postings</h2>
          <span className="text-fg-muted text-[12px] font-semibold tabular-nums">
            {reports.length} open
          </span>
        </div>
        <JobReportsQueue
          initial={reports.map((r) => ({
            id: r.id,
            reason: r.reason,
            details: r.details,
            createdAt: r.createdAt.toISOString(),
            jobTitle: r.jobPost.title,
            jobSlug: r.jobPost.slug,
            companyName: r.jobPost.company.companyProfile?.companyName ?? 'Company',
          }))}
        />
      </ConsoleWidth>
    </main>
  );
}

// A <dl> only permits dt/dd/div as children, so the pair is wrapped in a div.
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-baseline gap-1">
      <dd className="text-fg m-0 font-semibold tabular-nums">{value.toLocaleString('en-US')}</dd>
      <dt>{label}</dt>
    </div>
  );
}
