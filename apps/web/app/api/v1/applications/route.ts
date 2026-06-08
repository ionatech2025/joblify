import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';


export async function GET() {
  const user = await currentUser();
  if (!user || user.userType !== 'JOB_SEEKER')
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const rows = await db.jobApplication.findMany({
    where: { jobSeekerId: user.id },
    orderBy: { appliedAt: 'desc' },
    take: 50,
    include: {
      jobPost: { include: { company: { include: { companyProfile: true } } } },
    },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      jobPostId: r.jobPostId,
      jobTitle: r.jobPost.title,
      companyName: r.jobPost.company.companyProfile?.companyName ?? 'Company',
      status: r.status,
      appliedAt: r.appliedAt.toISOString(),
      matchScore: r.matchScore,
    })),
  );
}
