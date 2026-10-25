import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ArrowRight, MessagesSquare } from 'lucide-react';
import { ConsoleWidth } from '@/app/components/console/shell';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { ListView, type ListColumn } from '@/app/components/console/list-view';
import { Badge } from '@/app/components/ui/badge';
import { EmptyState } from '@/app/components/ui/empty-state';
import { ChatAreaButton } from './chat-area-button';

export const metadata = { title: 'Chat areas' };

type AreaRow = {
  id: string;
  title: string;
  kind: 'JOB' | 'VIRTUAL_INTERN';
  jobTitle: string | null;
  participants: number;
  messages: number;
};

// Company chat hub: one area per job (created on demand) plus the single
// virtual-intern area (flowchart: "create job specific chat area" / "create
// virtual intern chat area").
export default async function CompanyChatsPage() {
  const user = await requireRole('COMPANY');

  const [areas, jobsWithoutArea] = await Promise.all([
    db.chatArea.findMany({
      where: { companyId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        jobPost: { select: { title: true } },
        _count: { select: { participants: true, messages: true } },
      },
    }),
    db.jobPost.findMany({
      where: { companyId: user.id, deletedAt: null, chatArea: { is: null } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, title: true },
    }),
  ]);

  const hasViArea = areas.some((a) => a.kind === 'VIRTUAL_INTERN');

  const rows: AreaRow[] = areas.map((a) => ({
    id: a.id,
    title: a.title,
    kind: a.kind,
    jobTitle: a.jobPost?.title ?? null,
    participants: a._count.participants,
    messages: a._count.messages,
  }));

  const columns: ListColumn<AreaRow>[] = [
    {
      key: 'title',
      header: 'Chat area',
      cell: (a) => (
        <div className="min-w-0">
          <Link
            href={`/company/chats/${a.id}`}
            className="text-fg font-semibold no-underline hover:underline"
          >
            {a.title}
          </Link>
          <span className="text-fg-muted block text-[12px] sm:hidden">
            {a.kind === 'VIRTUAL_INTERN'
              ? 'Virtual interns'
              : `Job · ${a.jobTitle ?? 'deleted job'}`}
          </span>
        </div>
      ),
      aggregate: () => `${rows.length} area${rows.length === 1 ? '' : 's'}`,
    },
    {
      key: 'context',
      header: 'Scope',
      hideBelow: 'sm',
      cell: (a) =>
        a.kind === 'VIRTUAL_INTERN' ? (
          <Badge tone="brand">Virtual interns</Badge>
        ) : (
          <span className="text-fg-muted">Job · {a.jobTitle ?? 'deleted job'}</span>
        ),
    },
    {
      key: 'participants',
      header: 'Participants',
      align: 'end',
      hideBelow: 'sm',
      cell: (a) => <span className="text-fg-muted tabular-nums">{a.participants}</span>,
      aggregate: (r) => r.reduce((n, x) => n + x.participants, 0),
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
          href={`/company/chats/${a.id}`}
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
      <ControlPanel
        breadcrumb={<Breadcrumb items={[{ label: 'Chats' }]} />}
        actions={!hasViArea ? <ChatAreaButton kind="virtual-intern" /> : undefined}
      />
      <ConsoleWidth className="max-w-5xl py-3">
        <p className="text-fg-muted mb-2 text-[13px]">
          Job-specific rooms for shortlisted applicants, plus one room for your virtual interns.
        </p>
        {rows.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare />}
            title="No chat areas yet"
            description="Create one for a job below, or open your virtual-intern area. Shortlisted applicants join their job's area automatically."
          />
        ) : (
          <ListView
            caption="Company chat areas"
            rows={rows}
            rowKey={(a) => a.id}
            columns={columns}
          />
        )}

        {jobsWithoutArea.length > 0 && (
          <section className="mt-6">
            <h2 className="text-fg mb-2 text-[14px] font-semibold">Jobs without a chat area</h2>
            <ul className="border-border bg-surface rounded-card divide-border m-0 list-none divide-y overflow-hidden border p-0">
              {jobsWithoutArea.map((j) => (
                <li
                  key={j.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5"
                >
                  <span className="text-fg text-[13px] font-medium">{j.title}</span>
                  <ChatAreaButton kind="job" jobPostId={j.id} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </ConsoleWidth>
    </main>
  );
}
