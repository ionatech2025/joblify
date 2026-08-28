import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ArrowRight, MessagesSquare } from 'lucide-react';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { EmptyState } from '@/app/components/ui/empty-state';
import { buttonClasses } from '@/app/components/ui/button';

export const metadata = { title: 'My chats' };

// Chat areas the seeker belongs to — companies add you when you're
// shortlisted for a job or invited as a virtual intern.
export default async function JobseekerChatsPage() {
  const user = await requireRole('JOB_SEEKER');

  const memberships = await db.chatParticipant.findMany({
    where: { userId: user.id },
    take: 100,
    include: {
      chatArea: {
        include: {
          company: { select: { companyProfile: { select: { companyName: true } } } },
          jobPost: { select: { title: true } },
          _count: { select: { messages: true } },
        },
      },
    },
    orderBy: { chatArea: { updatedAt: 'desc' } },
  });

  return (
    <main>
      <ControlPanel breadcrumb={<Breadcrumb items={[{ label: 'Chats' }]} />} />
      <div className="mx-auto w-full max-w-5xl px-3 py-3 sm:px-4">
        <p className="text-fg-muted mb-2 text-[13px]">
          Companies add you here when you're shortlisted for a job or invited as a virtual intern.
        </p>
        {memberships.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare />}
            title="No conversations yet"
            description="Apply to jobs or subscribe to companies. Once a company shortlists or invites you, the conversation opens here."
            action={
              <Link href="/jobs" className={`${buttonClasses()} no-underline`}>
                Find a role
              </Link>
            }
          />
        ) : (
          <ul className="grid list-none grid-cols-1 gap-3 p-0">
            {memberships.map(({ chatArea: a }) => (
              <li
                key={a.id}
                className="rounded-card border border-border bg-surface p-4 shadow-soft"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/jobseeker/chats/${a.id}`}
                      className="font-semibold text-fg hover:underline"
                    >
                      {a.title}
                    </Link>
                    <p className="mt-1 mb-0 text-xs text-fg-subtle">
                      {a.company.companyProfile?.companyName ?? 'Company'}
                      {a.jobPost ? ` · ${a.jobPost.title}` : ' · Virtual interns'} ·{' '}
                      {a._count.messages} message
                      {a._count.messages === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Link
                    href={`/jobseeker/chats/${a.id}`}
                    className="inline-flex items-center gap-1 text-sm text-brand underline"
                  >
                    Open
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
