import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ArrowRight, MessagesSquare } from 'lucide-react';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { ListView, type ListColumn } from '@/app/components/console/list-view';
import { Badge } from '@/app/components/ui/badge';
import { EmptyState } from '@/app/components/ui/empty-state';
import { buttonClasses } from '@/app/components/ui/button';

export const metadata = { title: 'My chats' };

type ChatRow = {
  id: string;
  title: string;
  companyName: string;
  roleTitle: string | null;
  messages: number;
};

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

  const rows: ChatRow[] = memberships.map(({ chatArea: a }) => ({
    id: a.id,
    title: a.title,
    companyName: a.company.companyProfile?.companyName ?? 'Company',
    roleTitle: a.jobPost?.title ?? null,
    messages: a._count.messages,
  }));

  const columns: ListColumn<ChatRow>[] = [
    {
      key: 'title',
      header: 'Conversation',
      cell: (a) => (
        <div className="min-w-0">
          <Link
            href={`/jobseeker/chats/${a.id}`}
            className="text-fg font-semibold no-underline hover:underline"
          >
            {a.title}
          </Link>
          <span className="text-fg-muted block text-[12px] sm:hidden">
            {a.companyName} · {a.roleTitle ?? 'Virtual interns'}
          </span>
        </div>
      ),
      aggregate: () => `${rows.length} conversation${rows.length === 1 ? '' : 's'}`,
    },
    {
      key: 'company',
      header: 'Company',
      hideBelow: 'sm',
      cell: (a) => <span className="text-fg-muted">{a.companyName}</span>,
    },
    {
      key: 'context',
      header: 'Context',
      hideBelow: 'md',
      cell: (a) =>
        a.roleTitle ? (
          <span className="text-fg-muted">{a.roleTitle}</span>
        ) : (
          <Badge tone="neutral">Virtual interns</Badge>
        ),
    },
    {
      key: 'messages',
      header: 'Messages',
      align: 'end',
      cell: (a) => <span className="text-fg-muted tabular-nums">{a.messages}</span>,
      aggregate: (r) => r.reduce((n, x) => n + x.messages, 0),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'end',
      cell: (a) => (
        <Link
          href={`/jobseeker/chats/${a.id}`}
          className="text-brand inline-flex min-h-6 items-center gap-1 no-underline hover:underline"
        >
          Open
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      ),
    },
  ];

  return (
    <main>
      <ControlPanel breadcrumb={<Breadcrumb items={[{ label: 'Chats' }]} />} />
      <ConsoleWidth className="max-w-5xl py-3">
        <p className="text-fg-muted mb-2 text-[13px]">
          Companies add you here when you&apos;re shortlisted for a job or invited as a virtual
          intern.
        </p>
        {rows.length === 0 ? (
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
          <ListView caption="My conversations" rows={rows} rowKey={(a) => a.id} columns={columns} />
        )}
      </ConsoleWidth>
    </main>
  );
}
