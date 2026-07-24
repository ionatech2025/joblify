import { Suspense } from 'react';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ApplicationsList } from './applications-list';
import { RecentlyViewed } from '../recently-viewed';
import type { ApplicationListItem } from '@/lib/query/applications';
import { PageHeader } from '@/app/components/ui/ambient';
import { Card } from '@/app/components/ui/card';
import { Stat, StatRow } from '@/app/components/ui/stat';

export const metadata = { title: 'My applications' };

export default async function JobseekerApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ just_applied?: string }>;
}) {
  const user = await requireRole('JOB_SEEKER');
  const sp = await searchParams;

  // JOB_UC_09.0: real-time application tracking is a premium feature. Every
  // account defaults to PRO today, so this renders the list for everyone —
  // the banner only appears once a FREE tier actually exists.
  if (user.plan !== 'PRO') {
    return (
      <main>
        <PageHeader eyebrow="Your pipeline" title="My applications" width="max-w-4xl" />
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 text-center shadow-soft">
            <p className="m-0 font-semibold text-neutral-900">Track your applications with Pro</p>
            <p className="mt-1 mb-0 text-sm text-neutral-600">
              See real-time status — viewed, shortlisted, interview, and outcome — for every job
              you&apos;ve applied to.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const rows = await db.jobApplication.findMany({
    where: { jobSeekerId: user.id },
    orderBy: { appliedAt: 'desc' },
    include: {
      jobPost: { include: { company: { include: { companyProfile: true } } } },
    },
    take: 50,
  });

  const initialData: ApplicationListItem[] = rows.map((r) => ({
    id: r.id,
    jobPostId: r.jobPostId,
    slug: r.jobPost.slug,
    jobTitle: r.jobPost.title,
    companyName: r.jobPost.company.companyProfile?.companyName ?? 'Company',
    status: r.status,
    appliedAt: r.appliedAt.toISOString(),
    matchScore: r.matchScore,
  }));

  // Dashboard stat strip, derived purely from the rows fetched above — no
  // extra queries. "In progress" = anywhere between shortlist and offer.
  const inProgress = initialData.filter((a) =>
    ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED'].includes(a.status),
  ).length;
  const hired = initialData.filter((a) => a.status === 'HIRED').length;

  return (
    <main>
      <PageHeader eyebrow="Your pipeline" title="My applications" width="max-w-4xl" />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {sp.just_applied && (
        <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
          Application submitted — you&apos;ll get an email when the team updates the status.
        </div>
      )}
      {initialData.length > 0 && (
        <Card className="mb-8 p-6">
          <StatRow>
            <Stat value={initialData.length} label="Applications" />
            <Stat value={inProgress} label="In progress" />
            <Stat value={hired} label="Hired" />
          </StatRow>
        </Card>
      )}
      <Suspense fallback={null}>
        <RecentlyViewed userId={user.id} />
      </Suspense>
      <ApplicationsList userId={user.id} initialData={initialData} />
      </div>
    </main>
  );
}
