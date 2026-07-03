import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { subscribeToCompany, unsubscribeFromCompany } from '@/app/actions/subscriptions';
import { Button } from '@/app/components/ui/button';

// Follow/unfollow control on the public company page (JOB_UC_07.0: subscribe
// as EMPLOYABLE or VIRTUAL_INTERN). The offered type follows the seeker's
// profile; the badge shows any existing subscription of that type. Server
// component: reads the session, so it must render inside the page's dynamic
// (post-connection) body.
export async function SubscribeButton({ companyUserId }: { companyUserId: string }) {
  const user = await currentUser();

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50"
      >
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
      <Link
        href="/onboarding"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
      >
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

  const typeLabel = profile.profileType === 'VIRTUAL_INTERN' ? 'virtual intern' : 'employable';

  if (subscription) {
    return (
      <form action={unsubscribeFromCompany.bind(null, companyUserId, profile.profileType)}>
        <Button type="submit" variant="secondary">
          Subscribed as {typeLabel} ✓ — unsubscribe
        </Button>
      </form>
    );
  }

  return (
    <form action={subscribeToCompany.bind(null, companyUserId, profile.profileType)}>
      <Button type="submit">Subscribe as {typeLabel}</Button>
    </form>
  );
}
