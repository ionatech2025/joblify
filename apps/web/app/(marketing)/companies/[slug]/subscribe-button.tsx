import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { buttonClasses } from '@/app/components/ui/button';
import { SubscribeToggle } from './subscribe-toggle';

// Follow/unfollow control on the public company page (JOB_UC_07.0: subscribe
// as EMPLOYABLE or VIRTUAL_INTERN). The offered type follows the seeker's
// profile; the badge shows any existing subscription of that type. Server
// component: reads the session, so it must render inside the page's dynamic
// (post-connection) body.
export async function SubscribeButton({ companyUserId }: { companyUserId: string }) {
  const user = await currentUser();

  if (!user) {
    return (
      <Link href="/sign-in" className={`${buttonClasses('secondary', 'sm')} no-underline`}>
        Sign in to subscribe
      </Link>
    );
  }
  if (user.userType !== 'JOB_SEEKER') return null;

  const profile = await db.jobSeekerProfile.findUnique({
    where: { userId: user.id },
    select: { profileType: true },
  });

  if (!profile) {
    return (
      <Link href="/onboarding" className={`${buttonClasses('primary', 'sm')} no-underline`}>
        Set up your profile to subscribe
      </Link>
    );
  }

  const subscription = await db.companySubscription.findUnique({
    where: {
      companyId_jobSeekerId_profileType: {
        companyId: companyUserId,
        jobSeekerId: user.id,
        profileType: profile.profileType,
      },
    },
    select: { id: true },
  });

  return (
    <SubscribeToggle
      companyUserId={companyUserId}
      profileType={profile.profileType}
      initialSubscribed={!!subscription}
    />
  );
}
