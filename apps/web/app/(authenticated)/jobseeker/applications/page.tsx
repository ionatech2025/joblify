import { Suspense } from 'react';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ApplicationsList } from './applications-list';
import { RecentlyViewed } from '../recently-viewed';
import type { ApplicationListItem } from '@/lib/query/applications';

export const metadata = { title: 'My applications' };

export default async function JobseekerApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ just_applied?: string }>;
}) {
  const user = await requireRole('JOB_SEEKER');
  const sp = await searchParams;

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
    jobTitle: r.jobPost.title,
    companyName: r.jobPost.company.companyProfile?.companyName ?? 'Company',
    status: r.status,
    appliedAt: r.appliedAt.toISOString(),
    matchScore: r.matchScore,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-4 text-2xl font-bold text-neutral-900">My applications</h1>
      {sp.just_applied && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Application submitted — you&apos;ll get an email when the team updates the status.
        </div>
      )}
      <Suspense fallback={null}>
        <RecentlyViewed userId={user.id} />
      </Suspense>
      <ApplicationsList userId={user.id} initialData={initialData} />
    </main>
  );
}
