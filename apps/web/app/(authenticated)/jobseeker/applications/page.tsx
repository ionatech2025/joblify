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
    <main style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
      <h1>My applications</h1>
      {sp.just_applied && (
        <div style={{ padding: '0.75rem 1rem', background: '#e7f6ec', borderRadius: 8, marginBottom: '1rem' }}>
          Application submitted — you'll get an email when the team updates the status.
        </div>
      )}
      <Suspense fallback={null}>
        <RecentlyViewed userId={user.id} />
      </Suspense>
      <ApplicationsList userId={user.id} initialData={initialData} />
    </main>
  );
}
