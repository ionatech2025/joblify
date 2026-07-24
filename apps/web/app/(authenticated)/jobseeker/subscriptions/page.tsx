import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { respondToInvitation } from '@/app/actions/invitations';
import { unsubscribeFromCompany } from '@/app/actions/subscriptions';
import { PageHeader } from '@/app/components/ui/ambient';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';

export const metadata = { title: 'My subscriptions' };

const typeLabel = (t: 'EMPLOYABLE' | 'VIRTUAL_INTERN') =>
  t === 'VIRTUAL_INTERN' ? 'Virtual intern' : 'Employable';

// "My Subscriptions" + invitation inbox (JOB_UC_07.0 / JOB_UC_10.1): pending
// company invitations to accept or decline, and the companies the seeker
// follows, per subscription type.
export default async function JobseekerSubscriptionsPage() {
  const user = await requireRole('JOB_SEEKER');

  const [invitations, subscriptions] = await Promise.all([
    db.invitation.findMany({
      where: { jobSeekerId: user.id, status: 'PENDING', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      include: { company: { select: { companyProfile: { select: { companyName: true, slug: true } } } } },
    }),
    db.companySubscription.findMany({
      where: { jobSeekerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { company: { select: { companyProfile: { select: { companyName: true, slug: true } } } } },
    }),
  ]);

  return (
    <main>
      <PageHeader
        title="My subscriptions"
        subtitle="Companies you follow, and invitations from companies that want you on board."
        width="max-w-3xl"
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {invitations.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-neutral-900">Invitations</h2>
            <ul className="mt-3 grid list-none grid-cols-1 gap-3 p-0">
              {invitations.map((inv) => (
                <li key={inv.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="m-0 font-medium text-neutral-900">
                        {inv.company.companyProfile?.companyName ?? 'A company'} invited you as{' '}
                        <strong>{typeLabel(inv.profileType)}</strong>
                      </p>
                      {inv.message && <p className="mt-1 mb-0 text-sm text-neutral-700">{inv.message}</p>}
                      <p className="mt-1 mb-0 text-xs text-neutral-500">
                        Sent {inv.createdAt.toLocaleDateString()} · expires {inv.expiresAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <form action={respondToInvitation.bind(null, inv.id, 'ACCEPT')}>
                        <Button type="submit" size="sm">
                          Accept
                        </Button>
                      </form>
                      <form action={respondToInvitation.bind(null, inv.id, 'DECLINE')}>
                        <Button type="submit" variant="secondary" size="sm">
                          Decline
                        </Button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Subscribed companies</h2>
          {subscriptions.length === 0 ? (
            <p className="text-neutral-600">
              You haven&apos;t subscribed to any companies yet.{' '}
              <Link href="/companies" className="text-indigo-700 hover:underline">
                Browse companies
              </Link>{' '}
              and subscribe to the ones you&apos;d like to work with.
            </p>
          ) : (
            <ul className="mt-3 grid list-none grid-cols-1 gap-2 p-0">
              {subscriptions.map((sub) => (
                <li
                  key={sub.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 shadow-soft"
                >
                  <div>
                    {sub.company.companyProfile ? (
                      <Link
                        href={`/companies/${sub.company.companyProfile.slug}`}
                        className="font-medium text-neutral-900 hover:underline"
                      >
                        {sub.company.companyProfile.companyName}
                      </Link>
                    ) : (
                      <span className="font-medium text-neutral-900">Company</span>
                    )}
                    <Badge tone="neutral" className="ml-2">
                      {typeLabel(sub.profileType)}
                    </Badge>
                  </div>
                  <form action={unsubscribeFromCompany.bind(null, sub.companyId, sub.profileType)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Unsubscribe
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
