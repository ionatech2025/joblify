import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

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
    default:
      redirect('/jobseeker/applications');
  }
}
