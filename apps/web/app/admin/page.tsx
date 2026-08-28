import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { VerificationQueue } from './verification-queue';

export const metadata = { title: 'Admin' };

export default async function AdminPage() {
  await requireRole('ADMIN');

  const [pending, jobSeekerCount, companyCount, publishedJobCount] = await Promise.all([
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
        <p className="text-fg-muted mb-2 text-[13px]">
          Unverified companies don&apos;t appear in the public directory or job search.
        </p>
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
