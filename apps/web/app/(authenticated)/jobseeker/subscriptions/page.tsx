import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { Building2 } from 'lucide-react';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { ListView, type ListColumn } from '@/app/components/console/list-view';
import { Badge } from '@/app/components/ui/badge';
import { buttonClasses } from '@/app/components/ui/button';
import { EmptyState } from '@/app/components/ui/empty-state';
import { InvitationActions } from './invitation-actions';
import { UnsubscribeButton } from './unsubscribe-button';
import { TimeStamp } from '@/app/components/ui/timestamp';

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
      take: 100,
      include: {
        company: { select: { companyProfile: { select: { companyName: true, slug: true } } } },
      },
    }),
    db.companySubscription.findMany({
      where: { jobSeekerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        company: { select: { companyProfile: { select: { companyName: true, slug: true } } } },
      },
    }),
  ]);

  type SubRow = (typeof subscriptions)[number];

  const columns: ListColumn<SubRow>[] = [
    {
      key: 'company',
      header: 'Company',
      cell: (sub) =>
        sub.company.companyProfile ? (
          <Link
            href={`/companies/${sub.company.companyProfile.slug}`}
            className="text-fg font-medium no-underline hover:underline"
          >
            {sub.company.companyProfile.companyName}
          </Link>
        ) : (
          <span className="text-fg font-medium">Company</span>
        ),
      aggregate: () => `${subscriptions.length} followed`,
    },
    {
      key: 'type',
      header: 'Subscription type',
      cell: (sub) => <Badge tone="neutral">{typeLabel(sub.profileType)}</Badge>,
    },
    {
      key: 'since',
      header: 'Followed',
      align: 'end',
      hideBelow: 'sm',
      cell: (sub) => <TimeStamp value={sub.createdAt} className="text-fg-muted" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (sub) => (
        <UnsubscribeButton
          companyId={sub.companyId}
          profileType={sub.profileType}
          companyName={sub.company.companyProfile?.companyName ?? 'this company'}
        />
      ),
    },
  ];

  return (
    <main>
      <ControlPanel
        breadcrumb={<Breadcrumb items={[{ label: 'Following' }]} />}
        actions={
          <Link href="/companies" className={`${buttonClasses('secondary', 'sm')} no-underline`}>
            Browse companies
          </Link>
        }
      />
      <ConsoleWidth className="max-w-4xl py-3">
        <p className="text-fg-muted mb-3 text-[13px]">
          Companies you follow, and invitations from companies that want you.
        </p>
        {invitations.length > 0 && (
          <section className="mb-6">
            <h2 className="text-fg mb-2 text-[14px] font-semibold">Invitations</h2>
            <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="rounded-card border-brand/30 bg-brand-subtle border px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-fg m-0 text-[13px] font-medium">
                        {inv.company.companyProfile?.companyName ?? 'A company'} invited you as{' '}
                        <strong>{typeLabel(inv.profileType)}</strong>
                      </p>
                      {inv.message && (
                        <p className="text-fg-muted mt-1 mb-0 text-[13px]">{inv.message}</p>
                      )}
                      <p className="text-fg-subtle mt-1 mb-0 text-[12px]">
                        Sent <TimeStamp value={inv.createdAt} /> · expires{' '}
                        <TimeStamp value={inv.expiresAt} />
                      </p>
                    </div>
                    <InvitationActions invitationId={inv.id} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="text-fg mb-2 text-[14px] font-semibold">Subscribed companies</h2>
          {subscriptions.length === 0 ? (
            <EmptyState
              icon={<Building2 />}
              title="Not following anyone yet"
              description="Subscribe to a company and they can invite you to roles and chats before those roles are public."
              action={
                <Link href="/companies" className={`${buttonClasses()} no-underline`}>
                  Browse companies
                </Link>
              }
            />
          ) : (
            <ListView
              caption="Subscribed companies"
              rows={subscriptions}
              rowKey={(sub) => sub.id}
              columns={columns}
            />
          )}
        </section>
      </ConsoleWidth>
    </main>
  );
}
