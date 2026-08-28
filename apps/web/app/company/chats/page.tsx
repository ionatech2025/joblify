import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ArrowRight, MessagesSquare } from 'lucide-react';
import { Breadcrumb, ControlPanel } from '@/app/components/console/control-panel';
import { EmptyState } from '@/app/components/ui/empty-state';
import { ChatAreaButton } from './chat-area-button';

export const metadata = { title: 'Chat areas' };

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

  return (
    <main>
      <ControlPanel
        breadcrumb={<Breadcrumb items={[{ label: 'Chats' }]} />}
        actions={!hasViArea ? <ChatAreaButton kind="virtual-intern" /> : undefined}
      />
      <div className="mx-auto w-full max-w-5xl px-3 py-3 sm:px-4">
        <p className="text-fg-muted mb-2 text-[13px]">
          Job-specific rooms for shortlisted applicants, plus one room for your virtual interns.
        </p>
        {areas.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare />}
            title="No chat areas yet"
            description="Create one for a job above, or open your virtual-intern area. Shortlisted applicants join their job's area automatically."
          />
        ) : (
          <ul className="grid list-none grid-cols-1 gap-3 p-0">
            {areas.map((a) => (
              <li
                key={a.id}
                className="rounded-card border border-border bg-surface p-4 shadow-soft"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/company/chats/${a.id}`}
                      className="font-semibold text-fg hover:underline"
                    >
                      {a.title}
                    </Link>
                    <p className="mt-1 mb-0 text-xs text-fg-subtle">
                      {a.kind === 'VIRTUAL_INTERN'
                        ? 'Virtual interns'
                        : `Job · ${a.jobPost?.title ?? 'deleted job'}`}{' '}
                      · {a._count.participants} participant{a._count.participants === 1 ? '' : 's'}{' '}
                      · {a._count.messages} message{a._count.messages === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Link
                    href={`/company/chats/${a.id}`}
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

        {jobsWithoutArea.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-fg">Jobs without a chat area</h2>
            <ul className="mt-3 grid list-none grid-cols-1 gap-2 p-0">
              {jobsWithoutArea.map((j) => (
                <li
                  key={j.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3 shadow-soft"
                >
                  <span className="text-sm font-medium text-fg">{j.title}</span>
                  <ChatAreaButton kind="job" jobPostId={j.id} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
