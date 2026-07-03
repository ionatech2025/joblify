import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

// Role-aware redirect. Hit this after sign-in / sign-up; the route group
// layout already enforces auth.

export default async function DashboardLandingPage() {
  const user = await requireUser();

  switch (user.userType) {
    case 'COMPANY':
      redirect('/company/jobs');
    case 'ADMIN':
      redirect('/admin');
    case 'JOB_SEEKER':
    default: {
      // Brand-new accounts haven't picked a path yet (flowchart: "Company or
      // Job seeker?") — send them through onboarding first.
      const profile = await db.jobSeekerProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      redirect(profile ? '/jobseeker/applications' : '/onboarding');
    }
  }
}
